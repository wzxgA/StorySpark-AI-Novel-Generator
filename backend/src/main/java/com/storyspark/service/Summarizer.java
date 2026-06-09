package com.storyspark.service;

import com.storyspark.config.EncryptionUtil;
import com.storyspark.model.entity.*;
import com.storyspark.model.enums.SynopsisType;
import com.storyspark.repository.AIConfigRepository;
import com.storyspark.repository.ChapterRepository;
import com.storyspark.repository.SynopsisRepository;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class Summarizer {

    private static final Logger log = LoggerFactory.getLogger(Summarizer.class);

    private static final int LEVEL_1_INTERVAL = 12;
    private static final int LEVEL_2_INTERVAL = 36;
    private static final int LEVEL_3_INTERVAL = 90;

    private final SynopsisRepository synopsisRepository;
    private final ChapterRepository chapterRepository;
    private final AIConfigRepository aiConfigRepository;

    public Summarizer(SynopsisRepository synopsisRepository,
                      ChapterRepository chapterRepository,
                      AIConfigRepository aiConfigRepository) {
        this.synopsisRepository = synopsisRepository;
        this.chapterRepository = chapterRepository;
        this.aiConfigRepository = aiConfigRepository;
    }

    @Transactional
    public void summarizeAfterBatch(Long novelId, Novel novel, int lastCompletedChapter) {
        try {
            checkAndGenerateLevel1(novel, lastCompletedChapter);
            checkAndGenerateLevel2(novel, lastCompletedChapter);
            checkAndGenerateLevel3(novel);
        } catch (Exception e) {
            log.error("Auto-summary failed for novel {} after chapter {}", novelId, lastCompletedChapter, e);
        }
    }

    private void checkAndGenerateLevel1(Novel novel, int lastCompletedChapter) {
        List<Synopsis> level1Synopses = synopsisRepository
                .findByNovelIdAndSummaryLevelOrderByChapterRangeStartAsc(novel.getId(), 1);

        int highestEnd = level1Synopses.stream()
                .mapToInt(Synopsis::getChapterRangeEnd)
                .max()
                .orElse(0);

        int nextCheckpoint = highestEnd == 0 ? LEVEL_1_INTERVAL : highestEnd + LEVEL_1_INTERVAL;

        while (nextCheckpoint <= lastCompletedChapter) {
            int startChapter = nextCheckpoint - LEVEL_1_INTERVAL + 1;
            int endChapter = nextCheckpoint;

            // Skip if this range already has a Level 1 synopsis
            boolean alreadyExists = level1Synopses.stream()
                    .anyMatch(s -> s.getChapterRangeStart() == startChapter
                            && s.getChapterRangeEnd() == endChapter);
            if (!alreadyExists) {
                generateLevel1Summary(novel, startChapter, endChapter);
                log.info("Generated Level 1 summary for chapters {}-{}", startChapter, endChapter);
            }
            nextCheckpoint += LEVEL_1_INTERVAL;
        }
    }

    private void checkAndGenerateLevel2(Novel novel, int lastCompletedChapter) {
        List<Synopsis> level1Synopses = synopsisRepository
                .findByNovelIdAndSummaryLevelOrderByChapterRangeStartAsc(novel.getId(), 1);
        List<Synopsis> level2Synopses = synopsisRepository
                .findByNovelIdAndSummaryLevelOrderByChapterRangeStartAsc(novel.getId(), 2);

        // Count Level 1 synopses with end <= lastCompletedChapter
        long eligibleL1Count = level1Synopses.stream()
                .filter(s -> s.getChapterRangeEnd() <= lastCompletedChapter)
                .count();

        int highestL2End = level2Synopses.stream()
                .mapToInt(Synopsis::getChapterRangeEnd)
                .max()
                .orElse(0);

        // How many L1 synopses needed per L2: 3
        int l1PerL2 = 3;
        int existingL2Count = (int) level2Synopses.stream()
                .filter(s -> s.getChapterRangeEnd() <= lastCompletedChapter)
                .count();
        int expectedL2Count = (int) (eligibleL1Count / l1PerL2);

        for (int i = existingL2Count; i < expectedL2Count; i++) {
            int l2Index = i + 1;
            int startIdx = l2Index * l1PerL2 - l1PerL2; // 0, 3, 6, ...
            int endIdx = Math.min(startIdx + l1PerL2, (int) eligibleL1Count);

            List<Synopsis> relevantL1s = level1Synopses.stream()
                    .filter(s -> s.getChapterRangeEnd() <= lastCompletedChapter)
                    .sorted(Comparator.comparingInt(Synopsis::getChapterRangeStart))
                    .skip(startIdx)
                    .limit(endIdx - startIdx)
                    .collect(Collectors.toList());

            if (relevantL1s.size() >= l1PerL2) {
                int combinedStart = relevantL1s.get(0).getChapterRangeStart();
                int combinedEnd = relevantL1s.get(relevantL1s.size() - 1).getChapterRangeEnd();

                // Check if this L2 range already exists
                boolean exists = level2Synopses.stream()
                        .anyMatch(s -> s.getChapterRangeStart() == combinedStart
                                && s.getChapterRangeEnd() == combinedEnd);
                if (!exists) {
                    String merged = relevantL1s.stream()
                            .map(s -> "第" + s.getChapterRangeStart() + "-" + s.getChapterRangeEnd() + "章：" + s.getContent())
                            .collect(Collectors.joining("\n"));
                    generateLevel2Summary(novel, combinedStart, combinedEnd, merged);
                    log.info("Generated Level 2 summary for chapters {}-{}", combinedStart, combinedEnd);
                }
            }
        }
    }

    private void checkAndGenerateLevel3(Novel novel) {
        List<Synopsis> level2Synopses = synopsisRepository
                .findByNovelIdAndSummaryLevelOrderByChapterRangeStartAsc(novel.getId(), 2);
        List<Synopsis> level3Synopses = synopsisRepository
                .findByNovelIdAndSummaryLevelOrderByChapterRangeStartAsc(novel.getId(), 3);

        int l2PerL3 = 3;
        int existingL3Count = level3Synopses.size();
        int expectedL3Count = level2Synopses.size() / l2PerL3;

        for (int i = existingL3Count; i < expectedL3Count; i++) {
            int l3Index = i + 1;
            int startIdx = l3Index * l2PerL3 - l2PerL3;
            int endIdx = Math.min(startIdx + l2PerL3, level2Synopses.size());

            List<Synopsis> relevantL2s = level2Synopses.stream()
                    .sorted(Comparator.comparingInt(Synopsis::getChapterRangeStart))
                    .skip(startIdx)
                    .limit(endIdx - startIdx)
                    .collect(Collectors.toList());

            if (relevantL2s.size() >= l2PerL3) {
                int combinedStart = relevantL2s.get(0).getChapterRangeStart();
                int combinedEnd = relevantL2s.get(relevantL2s.size() - 1).getChapterRangeEnd();

                boolean exists = level3Synopses.stream()
                        .anyMatch(s -> s.getChapterRangeStart() == combinedStart
                                && s.getChapterRangeEnd() == combinedEnd);
                if (!exists) {
                    String merged = relevantL2s.stream()
                            .map(s -> "第" + s.getChapterRangeStart() + "-" + s.getChapterRangeEnd() + "章：" + s.getContent())
                            .collect(Collectors.joining("\n"));
                    generateLevel3Summary(novel, combinedStart, combinedEnd, merged);
                    log.info("Generated Level 3 summary for chapters {}-{}", combinedStart, combinedEnd);
                }
            }
        }
    }

    private void generateLevel1Summary(Novel novel, int startChapter, int endChapter) {
        List<Chapter> chapters = chapterRepository.findByNovelIdOrderByChapterNumberAsc(novel.getId())
                .stream()
                .filter(ch -> ch.getChapterNumber() >= startChapter
                        && ch.getChapterNumber() <= endChapter
                        && ch.getContent() != null && !ch.getContent().isEmpty())
                .collect(Collectors.toList());

        if (chapters.isEmpty()) return;

        StringBuilder chapterContents = new StringBuilder();
        for (Chapter ch : chapters) {
            chapterContents.append("=== 第").append(ch.getChapterNumber()).append("章 ===\n");
            // Take first 2000 chars per chapter to avoid overwhelming the summary
            String content = ch.getContent();
            if (content.length() > 2000) {
                content = content.substring(0, 2000) + "...";
            }
            chapterContents.append(content).append("\n\n");
        }

        String prompt = "你是一个小说摘要助手。请用约500字总结以下小说章节的关键内容。\n" +
                "重点关注：主要剧情发展、转折点、角色互动、关键事件。\n\n" +
                "章节范围：第" + startChapter + "章 - 第" + endChapter + "章\n" +
                chapterContents +
                "\n请用中文回答，直接输出摘要内容，不要添加额外说明。";

        String summary = callLLM(prompt);
        if (summary == null || summary.isEmpty()) return;

        Synopsis synopsis = new Synopsis();
        synopsis.setNovel(novel);
        synopsis.setTitle("第" + startChapter + "-" + endChapter + "章摘要");
        synopsis.setChapterRangeStart(startChapter);
        synopsis.setChapterRangeEnd(endChapter);
        synopsis.setContent(summary);
        synopsis.setSummaryType(SynopsisType.AUTO);
        synopsis.setSummaryLevel(1);
        synopsisRepository.save(synopsis);
    }

    private void generateLevel2Summary(Novel novel, int startChapter, int endChapter, String mergedContent) {
        String prompt = "你是一个小说摘要助手。请用约300字将以下多份章节摘要合并为一份更高层次的摘要。\n" +
                "聚焦于主要故事线的发展、跨章节的重要转折点、以及世界观层面的重大事件。\n\n" +
                "章节范围：第" + startChapter + "章 - 第" + endChapter + "章\n" +
                "以下是各阶段摘要：\n" + mergedContent + "\n\n" +
                "请用中文回答，直接输出合并后的摘要内容，不要添加额外说明。";

        String summary = callLLM(prompt);
        if (summary == null || summary.isEmpty()) return;

        Synopsis synopsis = new Synopsis();
        synopsis.setNovel(novel);
        synopsis.setTitle("第" + startChapter + "-" + endChapter + "章阶段摘要");
        synopsis.setChapterRangeStart(startChapter);
        synopsis.setChapterRangeEnd(endChapter);
        synopsis.setContent(summary);
        synopsis.setSummaryType(SynopsisType.AUTO);
        synopsis.setSummaryLevel(2);
        synopsisRepository.save(synopsis);
    }

    private void generateLevel3Summary(Novel novel, int startChapter, int endChapter, String mergedContent) {
        String prompt = "你是一个小说摘要助手。请用约500字将以下多份阶段摘要合并为一份全局摘要。\n" +
                "聚焦于整部小说的总体走向、主要角色弧光、核心冲突演变和世界格局变化。\n\n" +
                "章节范围：第" + startChapter + "章 - 第" + endChapter + "章\n" +
                "以下是各阶段摘要：\n" + mergedContent + "\n\n" +
                "请用中文回答，直接输出合并后的摘要内容，不要添加额外说明。";

        String summary = callLLM(prompt);
        if (summary == null || summary.isEmpty()) return;

        Synopsis synopsis = new Synopsis();
        synopsis.setNovel(novel);
        synopsis.setTitle("第" + startChapter + "-" + endChapter + "章全局摘要");
        synopsis.setChapterRangeStart(startChapter);
        synopsis.setChapterRangeEnd(endChapter);
        synopsis.setContent(summary);
        synopsis.setSummaryType(SynopsisType.AUTO);
        synopsis.setSummaryLevel(3);
        synopsisRepository.save(synopsis);
    }

    private String callLLM(String userPrompt) {
        AIConfig config = aiConfigRepository.findById(1L).orElse(null);
        if (config == null || config.getApiKey() == null || config.getApiKey().isEmpty()) {
            log.warn("No AI config, skipping summary generation");
            return null;
        }

        String apiKey = config.getApiKey();
        try {
            apiKey = EncryptionUtil.decrypt(apiKey);
        } catch (Exception ignored) {}

        ChatLanguageModel model = OpenAiChatModel.builder()
                .baseUrl(config.getApiUrl())
                .apiKey(apiKey)
                .modelName(config.getModel())
                .temperature(0.3) // Lower temperature for summary consistency
                .maxTokens(1024)
                .timeout(Duration.ofSeconds(120))
                .build();

        try {
            String response = model.generate(
                    SystemMessage.from("你是一个专业的小说摘要助手，擅长提炼和概括故事内容。"),
                    UserMessage.from(userPrompt)
            ).content().text();
            return response != null ? response.trim() : null;
        } catch (Exception e) {
            log.error("LLM call failed for summary", e);
            return null;
        }
    }
}
