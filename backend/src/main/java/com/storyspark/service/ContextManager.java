package com.storyspark.service;

import com.storyspark.model.entity.AIConfig;
import com.storyspark.model.entity.Chapter;
import com.storyspark.model.entity.ChapterPlan;
import com.storyspark.model.entity.Novel;
import com.storyspark.model.entity.Synopsis;
import com.storyspark.model.entity.WorldBuilding;
import com.storyspark.model.enums.ChapterStatus;
import com.storyspark.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ContextManager {

    private static final Logger log = LoggerFactory.getLogger(ContextManager.class);

    private static final int SYSTEM_PROMPT_BUDGET = 500;
    private static final int INSTRUCTIONS_BUDGET = 200;
    private static final int CHAPTER_PLAN_CAP = 1000;
    private static final int CHARS_WB_CAP = 2000;
    private static final int OUTLINE_CAP = 1000;
    private static final int SYNOPSIS_CAP = 3000;

    private final TokenCounter tokenCounter;
    private final AIConfigRepository aiConfigRepository;
    private final CharacterRepository characterRepository;
    private final WorldBuildingRepository worldBuildingRepository;
    private final OutlineRepository outlineRepository;
    private final ChapterPlanRepository chapterPlanRepository;
    private final SynopsisRepository synopsisRepository;
    private final ChapterRepository chapterRepository;

    public ContextManager(TokenCounter tokenCounter,
                          AIConfigRepository aiConfigRepository,
                          CharacterRepository characterRepository,
                          WorldBuildingRepository worldBuildingRepository,
                          OutlineRepository outlineRepository,
                          ChapterPlanRepository chapterPlanRepository,
                          SynopsisRepository synopsisRepository,
                          ChapterRepository chapterRepository) {
        this.tokenCounter = tokenCounter;
        this.aiConfigRepository = aiConfigRepository;
        this.characterRepository = characterRepository;
        this.worldBuildingRepository = worldBuildingRepository;
        this.outlineRepository = outlineRepository;
        this.chapterPlanRepository = chapterPlanRepository;
        this.synopsisRepository = synopsisRepository;
        this.chapterRepository = chapterRepository;
    }

    public ContextAssembly buildContext(Novel novel, int chapterNumber) {
        Map<String, Integer> sectionTokens = new LinkedHashMap<>();

        String modelName = aiConfigRepository.findById(1L)
                .map(AIConfig::getModel)
                .orElse("gpt-4o");
        int budgetLimit = tokenCounter.getBudgetLimit(modelName);
        int remaining = budgetLimit;

        // Account for system prompt (not built here, but consumes budget)
        remaining -= SYSTEM_PROMPT_BUDGET;

        // === ChapterPlan context ===
        String chapterPlanText = buildChapterPlanContext(novel.getId(), chapterNumber);
        int chapterPlanTokens = tokenCounter.estimateTokens(chapterPlanText);
        if (chapterPlanTokens > CHAPTER_PLAN_CAP) {
            chapterPlanText = truncateToTokens(chapterPlanText, CHAPTER_PLAN_CAP);
            chapterPlanTokens = CHAPTER_PLAN_CAP;
        }
        remaining -= chapterPlanTokens;
        sectionTokens.put("chapterPlan", chapterPlanTokens);

        // === Characters + WorldBuilding (compressed) ===
        String charsWBText = buildCompressedCharsWB(novel.getId());
        int charsWBTokens = tokenCounter.estimateTokens(charsWBText);
        if (charsWBTokens > CHARS_WB_CAP) {
            charsWBText = truncateToTokens(charsWBText, CHARS_WB_CAP);
            charsWBTokens = CHARS_WB_CAP;
        }
        remaining -= charsWBTokens;
        sectionTokens.put("charactersWB", charsWBTokens);

        // === Outline fragments ===
        String outlineText = buildOutlineContext(novel.getId());
        int outlineTokens = tokenCounter.estimateTokens(outlineText);
        if (outlineTokens > OUTLINE_CAP) {
            outlineText = truncateToTokens(outlineText, OUTLINE_CAP);
            outlineTokens = OUTLINE_CAP;
        }
        remaining -= outlineTokens;
        sectionTokens.put("outline", outlineTokens);

        // === Synopsis priority-sorted ===
        String synopsisText = buildSynopsisContext(novel.getId(), chapterNumber);
        int synopsisTokens = tokenCounter.estimateTokens(synopsisText);
        if (synopsisTokens > SYNOPSIS_CAP) {
            synopsisText = truncateToTokens(synopsisText, SYNOPSIS_CAP);
            synopsisTokens = SYNOPSIS_CAP;
        }
        remaining -= synopsisTokens;
        sectionTokens.put("synopses", synopsisTokens);

        // === Recent N chapters ===
        ChaptersResult recentResult = buildRecentChaptersContext(novel.getId(), chapterNumber, remaining);
        remaining -= recentResult.tokensUsed;
        sectionTokens.put("recentChapters", recentResult.tokensUsed);

        // === Instructions ===
        String instructionsText = buildInstructions(novel, chapterNumber);
        int instructionsTokens = tokenCounter.estimateTokens(instructionsText);
        remaining -= instructionsTokens;
        sectionTokens.put("instructions", instructionsTokens);

        // === Assemble ===
        StringBuilder full = new StringBuilder();
        full.append("请写出第").append(chapterNumber).append("章的完整内容。\n\n");

        full.append("=== 小说信息 ===\n");
        full.append("标题：").append(novel.getTitle()).append("\n");
        if (novel.getDescription() != null && !novel.getDescription().isEmpty()) {
            full.append("简介：").append(novel.getDescription()).append("\n");
        }

        if (!outlineText.isEmpty()) {
            full.append("\n=== 大纲 ===\n").append(outlineText).append("\n");
        }
        if (!charsWBText.isEmpty()) {
            full.append("\n=== 角色与世界观 ===\n").append(charsWBText).append("\n");
        }
        if (!chapterPlanText.isEmpty()) {
            full.append("\n=== 本章计划 ===\n").append(chapterPlanText).append("\n");
        }
        if (!synopsisText.isEmpty()) {
            full.append("\n=== 前情摘要 ===\n").append(synopsisText).append("\n");
        }
        if (!recentResult.text.isEmpty()) {
            full.append("\n=== 最近章节内容 ===\n").append(recentResult.text).append("\n");
        }
        full.append("\n=== 写作要求 ===\n").append(instructionsText).append("\n");

        int totalUsed = budgetLimit - remaining;
        log.debug("Chapter {}: {}/{} tokens used, {} recent chapters, sections: {}",
                chapterNumber, totalUsed, budgetLimit, recentResult.chapterCount, sectionTokens);

        return new ContextAssembly(full.toString(), totalUsed, budgetLimit,
                recentResult.chapterCount, sectionTokens);
    }

    // ---- Section builders ----

    private String buildChapterPlanContext(Long novelId, int chapterNumber) {
        List<ChapterPlan> plans = chapterPlanRepository.findByNovelIdOrderByChapterRangeStartAsc(novelId);
        List<ChapterPlan> matching = plans.stream()
                .filter(p -> p.getChapterRangeStart() <= chapterNumber
                        && p.getChapterRangeEnd() >= chapterNumber)
                .sorted(Comparator
                        .<ChapterPlan>comparingInt(p ->
                                p.getChapterRangeStart() == p.getChapterRangeEnd() ? 0 : 1)
                        .thenComparingInt(p ->
                                p.getChapterRangeEnd() - p.getChapterRangeStart()))
                .collect(Collectors.toList());

        if (matching.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        for (ChapterPlan plan : matching) {
            if (plan.getOutline() != null && !plan.getOutline().isEmpty()) {
                sb.append("大纲指导：").append(plan.getOutline()).append("\n");
            }
            if (plan.getNotes() != null && !plan.getNotes().isEmpty()) {
                sb.append("备注：").append(plan.getNotes()).append("\n");
            }
            if (plan.getCharacterIds() != null && !plan.getCharacterIds().isEmpty()
                    && !plan.getCharacterIds().equals("[]")) {
                sb.append("指定角色ID：").append(plan.getCharacterIds()).append("\n");
            }
            if (plan.getItemIds() != null && !plan.getItemIds().isEmpty()
                    && !plan.getItemIds().equals("[]")) {
                sb.append("指定物品ID：").append(plan.getItemIds()).append("\n");
            }
            if (plan.getWorldBuildingIds() != null && !plan.getWorldBuildingIds().isEmpty()
                    && !plan.getWorldBuildingIds().equals("[]")) {
                sb.append("指定世界观ID：").append(plan.getWorldBuildingIds()).append("\n");
            }
        }
        return sb.toString();
    }

    private String buildCompressedCharsWB(Long novelId) {
        StringBuilder sb = new StringBuilder();

        List<com.storyspark.model.entity.Character> characters = characterRepository.findByNovelId(novelId);
        if (!characters.isEmpty()) {
            sb.append("角色：\n");
            for (com.storyspark.model.entity.Character ch : characters) {
                sb.append("- ").append(ch.getName());
                if (ch.getDescription() != null && !ch.getDescription().isEmpty()) {
                    String desc = ch.getDescription();
                    // Keep description brief — first sentence or first 80 chars
                    int cutoff = desc.indexOf('。');
                    if (cutoff == -1) cutoff = desc.indexOf('\n');
                    if (cutoff == -1 && desc.length() > 80) cutoff = 80;
                    sb.append("：").append(cutoff > 0 ? desc.substring(0, cutoff) : desc);
                }
                if (ch.getTraits() != null && !ch.getTraits().isEmpty()
                        && !ch.getTraits().equals("{}") && !ch.getTraits().equals("[]")) {
                    sb.append(" [特征] ").append(ch.getTraits());
                }
                sb.append("\n");
            }
        }

        List<WorldBuilding> wbEntries = worldBuildingRepository.findByNovelId(novelId);
        if (!wbEntries.isEmpty()) {
            sb.append("\n世界观：\n");
            for (WorldBuilding wb : wbEntries) {
                sb.append("- [").append(wb.getCategory()).append("] ").append(wb.getTitle());
                if (wb.getContent() != null && !wb.getContent().isEmpty()) {
                    String content = wb.getContent();
                    int cutoff = content.indexOf('。');
                    if (cutoff == -1) cutoff = content.indexOf('\n');
                    if (cutoff == -1 && content.length() > 80) cutoff = 80;
                    sb.append("：").append(cutoff > 0 ? content.substring(0, cutoff) : content);
                }
                sb.append("\n");
            }
        }

        return sb.toString();
    }

    private String buildOutlineContext(Long novelId) {
        return outlineRepository.findByNovelId(novelId)
                .map(outline -> {
                    if (outline.getContent() == null || outline.getContent().isEmpty()) return "";
                    return outline.getContent();
                })
                .orElse("");
    }

    private String buildSynopsisContext(Long novelId, int chapterNumber) {
        List<Synopsis> all = synopsisRepository.findByNovelIdOrderByChapterRangeStartAsc(novelId);
        if (all.isEmpty()) return "";

        List<Synopsis> priorSynopses = all.stream()
                .filter(s -> s.getChapterRangeEnd() < chapterNumber)
                .collect(Collectors.toList());
        if (priorSynopses.isEmpty()) return "";

        // Priority: all L3 → recent 2 L2 → recent 1 L1
        List<Synopsis> selected = new ArrayList<>();

        List<Synopsis> level3 = priorSynopses.stream()
                .filter(s -> s.getSummaryLevel() >= 3)
                .collect(Collectors.toList());
        selected.addAll(level3);

        List<Synopsis> level2 = priorSynopses.stream()
                .filter(s -> s.getSummaryLevel() == 2)
                .sorted(Comparator.comparingInt(Synopsis::getChapterRangeEnd).reversed())
                .collect(Collectors.toList());
        selected.addAll(level2.subList(0, Math.min(2, level2.size())));

        if (level2.isEmpty() || selected.size() < level3.size() + 2) {
            List<Synopsis> level1 = priorSynopses.stream()
                    .filter(s -> s.getSummaryLevel() <= 1)
                    .sorted(Comparator.comparingInt(Synopsis::getChapterRangeEnd).reversed())
                    .collect(Collectors.toList());
            if (!level1.isEmpty()) {
                selected.add(level1.get(0));
            }
        }

        // Sort by chapterRangeStart for chronological order
        selected.sort(Comparator.comparingInt(Synopsis::getChapterRangeStart));

        StringBuilder sb = new StringBuilder();
        for (Synopsis s : selected) {
            sb.append("第").append(s.getChapterRangeStart()).append("-")
                    .append(s.getChapterRangeEnd()).append("章");
            if (s.getSummaryLevel() >= 3) sb.append(" [全局摘要]");
            else if (s.getSummaryLevel() == 2) sb.append(" [阶段摘要]");
            sb.append("：").append(s.getContent()).append("\n");
        }
        return sb.toString();
    }

    private ChaptersResult buildRecentChaptersContext(Long novelId, int chapterNumber, int budget) {
        if (budget <= 0) return new ChaptersResult("", 0, 0);

        List<Chapter> allChapters = chapterRepository.findByNovelIdOrderByChapterNumberAsc(novelId);
        List<Chapter> priorChapters = allChapters.stream()
                .filter(ch -> ch.getChapterNumber() < chapterNumber
                        && ch.getStatus() == ChapterStatus.COMPLETED
                        && ch.getContent() != null && !ch.getContent().isEmpty())
                .sorted(Comparator.comparingInt(Chapter::getChapterNumber).reversed())
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        int count = 0;
        int used = 0;

        for (Chapter ch : priorChapters) {
            String candidate = "--- 第" + ch.getChapterNumber() + "章 " +
                    (ch.getTitle() != null ? ch.getTitle() : "") + " ---\n" +
                    ch.getContent() + "\n";
            int candidateTokens = tokenCounter.estimateTokens(candidate);
            if (used + candidateTokens > budget) break;
            sb.insert(0, candidate); // prepend to maintain chronological order
            used += candidateTokens;
            count++;
        }

        return new ChaptersResult(sb.toString(), used, count);
    }

    private String buildInstructions(Novel novel, int chapterNumber) {
        String chapterTitle = "第" + chapterNumber + "章";
        Chapter existingChapter = chapterRepository.findByNovelIdAndChapterNumber(novel.getId(), chapterNumber)
                .orElse(null);
        if (existingChapter != null && existingChapter.getTitle() != null
                && !existingChapter.getTitle().isEmpty()
                && !existingChapter.getTitle().equals(chapterTitle)) {
            chapterTitle = existingChapter.getTitle();
        }

        AIConfig config = aiConfigRepository.findById(1L).orElse(null);
        int targetWords = config != null ? config.getChapterWordCount() : 3000;

        return "章节：" + chapterTitle + "\n" +
                "目标字数：约" + targetWords + "字\n" +
                "请直接开始写正文内容。";
    }

    /**
     * Truncate text to approximately fit within the given token budget.
     * Simple approach: estimate tokens, then trim proportionally.
     */
    private String truncateToTokens(String text, int maxTokens) {
        if (text == null || text.isEmpty()) return "";
        int currentTokens = tokenCounter.estimateTokens(text);
        if (currentTokens <= maxTokens) return text;

        // Proportionally truncate
        double ratio = (double) maxTokens / currentTokens * 0.9; // 10% safety margin
        int targetLength = (int) (text.length() * ratio);
        if (targetLength <= 0) targetLength = Math.min(text.length(), 100);
        // Try to break at a newline
        int cutoff = targetLength;
        int lastNewline = text.lastIndexOf('\n', cutoff);
        if (lastNewline > cutoff * 0.7) {
            cutoff = lastNewline;
        }
        return text.substring(0, cutoff) + "\n...(truncated)";
    }

    // ---- Inner classes ----

    public static class ContextAssembly {
        private final String fullUserPrompt;
        private final int totalTokensUsed;
        private final int budgetLimit;
        private final int recentChapterCount;
        private final Map<String, Integer> sectionTokens;

        ContextAssembly(String fullUserPrompt, int totalTokensUsed, int budgetLimit,
                        int recentChapterCount, Map<String, Integer> sectionTokens) {
            this.fullUserPrompt = fullUserPrompt;
            this.totalTokensUsed = totalTokensUsed;
            this.budgetLimit = budgetLimit;
            this.recentChapterCount = recentChapterCount;
            this.sectionTokens = sectionTokens;
        }

        public String getFullUserPrompt() { return fullUserPrompt; }
        public int getTotalTokensUsed() { return totalTokensUsed; }
        public int getBudgetLimit() { return budgetLimit; }
        public int getRecentChapterCount() { return recentChapterCount; }
        public Map<String, Integer> getSectionTokens() { return sectionTokens; }
    }

    private static class ChaptersResult {
        final String text;
        final int tokensUsed;
        final int chapterCount;

        ChaptersResult(String text, int tokensUsed, int chapterCount) {
            this.text = text;
            this.tokensUsed = tokensUsed;
            this.chapterCount = chapterCount;
        }
    }
}
