package com.storyspark.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storyspark.config.EncryptionUtil;
import com.storyspark.model.entity.*;
import com.storyspark.model.enums.ChapterStatus;
import com.storyspark.repository.*;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.model.output.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
public class AIGenerationService {

    private static final Logger log = LoggerFactory.getLogger(AIGenerationService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
            你是专业小说家。请严格按照以下设定和指引创作章节内容：
            - 保持角色性格和行为一致
            - 严格遵循世界观设定，不添加矛盾的设定
            - 按照大纲推动剧情发展
            - 使用 Markdown 格式书写，适当使用标题和段落
            - 内容生动详实，注重细节描写
            - 直接输出章节正文，不要添加额外说明""";

    private final AIConfigRepository aiConfigRepository;
    private final NovelRepository novelRepository;
    private final ChapterRepository chapterRepository;
    private final OutlineRepository outlineRepository;
    private final com.storyspark.repository.CharacterRepository characterRepository;
    private final WorldBuildingRepository worldBuildingRepository;
    private final ChapterPlanRepository chapterPlanRepository;
    private final SynopsisRepository synopsisRepository;

    public AIGenerationService(AIConfigRepository aiConfigRepository, NovelRepository novelRepository,
                               ChapterRepository chapterRepository, OutlineRepository outlineRepository,
                               com.storyspark.repository.CharacterRepository characterRepository,
                               WorldBuildingRepository worldBuildingRepository,
                               ChapterPlanRepository chapterPlanRepository, SynopsisRepository synopsisRepository) {
        this.aiConfigRepository = aiConfigRepository;
        this.novelRepository = novelRepository;
        this.chapterRepository = chapterRepository;
        this.outlineRepository = outlineRepository;
        this.characterRepository = characterRepository;
        this.worldBuildingRepository = worldBuildingRepository;
        this.chapterPlanRepository = chapterPlanRepository;
        this.synopsisRepository = synopsisRepository;
    }

    /**
     * Generate content for an existing chapter by chapter ID.
     */
    public void generateForChapter(Long novelId, Long chapterId, SseEmitter emitter) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found: " + chapterId));
        generateSingleChapter(novelId, chapter.getChapterNumber(), emitter);
    }

    public void generateSingleChapter(Long novelId, int chapterNumber, SseEmitter emitter) {
        AtomicBoolean cancelled = new AtomicBoolean(false);

        emitter.onCompletion(() -> cancelled.set(true));
        emitter.onError(e -> cancelled.set(true));
        emitter.onTimeout(() -> cancelled.set(true));

        AIConfig config = aiConfigRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("AI config not found"));

        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new RuntimeException("Novel not found"));

        Chapter chapter = chapterRepository.findByNovelIdAndChapterNumber(novelId, chapterNumber)
                .orElse(null);

        String userPrompt = buildUserPrompt(novel, chapterNumber);

        StreamingChatLanguageModel model = createModel(config);

        StringBuilder fullContent = new StringBuilder();

        try {
            model.generate(
                    List.of(new SystemMessage(SYSTEM_PROMPT), new UserMessage(userPrompt)),
                    Collections.emptyList(),
                    new StreamingResponseHandler<AiMessage>() {
                        @Override
                        public void onNext(String token) {
                            if (cancelled.get()) return;
                            try {
                                fullContent.append(token);
                                sendSseEvent(emitter, "token", Map.of(
                                        "token", token,
                                        "chapterId", chapter != null ? chapter.getId() : 0
                                ));
                            } catch (Exception e) {
                                cancelled.set(true);
                            }
                        }

                        @Override
                        public void onComplete(Response<AiMessage> response) {
                            String content = fullContent.toString();
                            int wordCount = content.trim().isEmpty() ? 0
                                    : content.trim().split("\\s+").length;

                            try {
                                Chapter ch = chapter;
                                if (ch == null) {
                                    ch = new Chapter();
                                    ch.setNovel(novel);
                                    ch.setChapterNumber(chapterNumber);
                                    ch.setTitle("第" + chapterNumber + "章");
                                }
                                ch.setContent(content);
                                ch.setWordCount(wordCount);
                                ch.setStatus(ChapterStatus.COMPLETED);
                                chapterRepository.save(ch);

                                sendSseEvent(emitter, "done", Map.of(
                                        "chapterId", ch.getId(),
                                        "wordCount", wordCount
                                ));
                                emitter.complete();
                            } catch (Exception e) {
                                log.error("Failed to save chapter", e);
                                sendSseSilent(emitter, "error",
                                        Map.of("message", "保存失败: " + e.getMessage()));
                                emitter.complete();
                            }
                        }

                        @Override
                        public void onError(Throwable error) {
                            log.error("Generation error", error);
                            sendSseSilent(emitter, "error",
                                    Map.of("message", error.getMessage()));
                            emitter.complete();
                        }
                    });
        } catch (Exception e) {
            log.error("Failed to start generation", e);
            sendSseSilent(emitter, "error", Map.of("message", e.getMessage()));
            emitter.complete();
        }
    }

    private StreamingChatLanguageModel createModel(AIConfig config) {
        String apiKey = config.getApiKey();
        try {
            apiKey = EncryptionUtil.decrypt(apiKey);
        } catch (Exception ignored) {}

        return OpenAiStreamingChatModel.builder()
                .baseUrl(config.getApiUrl())
                .apiKey(apiKey)
                .modelName(config.getModel())
                .temperature(config.getTemperature())
                .maxTokens(config.getMaxTokens())
                .timeout(Duration.ofSeconds(180))
                .build();
    }

    private String buildUserPrompt(Novel novel, int chapterNumber) {
        StringBuilder sb = new StringBuilder();

        sb.append("请写出第").append(chapterNumber).append("章的完整内容。\n\n");

        sb.append("=== 小说信息 ===\n");
        sb.append("标题：").append(novel.getTitle()).append("\n");
        if (novel.getDescription() != null && !novel.getDescription().isEmpty()) {
            sb.append("简介：").append(novel.getDescription()).append("\n");
        }

        outlineRepository.findByNovelId(novel.getId()).ifPresent(outline -> {
            if (outline.getContent() != null && !outline.getContent().isEmpty()) {
                sb.append("\n=== 大纲 ===\n");
                sb.append(outline.getContent()).append("\n");
            }
        });

        List<com.storyspark.model.entity.Character> characters = characterRepository.findByNovelId(novel.getId());
        if (!characters.isEmpty()) {
            sb.append("\n=== 角色列表 ===\n");
            for (var ch : characters) {
                sb.append("- 名称：").append(ch.getName());
                if (ch.getDescription() != null && !ch.getDescription().isEmpty()) {
                    sb.append("\n  描述：").append(ch.getDescription());
                }
                if (ch.getTraits() != null && !ch.getTraits().isEmpty()) {
                    sb.append("\n  特征：").append(ch.getTraits());
                }
                if (ch.getRelationships() != null && !ch.getRelationships().isEmpty()) {
                    sb.append("\n  关系：").append(ch.getRelationships());
                }
                sb.append("\n");
            }
        }

        List<WorldBuilding> wbEntries = worldBuildingRepository.findByNovelId(novel.getId());
        if (!wbEntries.isEmpty()) {
            sb.append("\n=== 世界观设定 ===\n");
            for (WorldBuilding wb : wbEntries) {
                sb.append("- [").append(wb.getCategory()).append("] ").append(wb.getTitle());
                if (wb.getContent() != null && !wb.getContent().isEmpty()) {
                    sb.append("：").append(wb.getContent());
                }
                sb.append("\n");
            }
        }

        List<ChapterPlan> plans = chapterPlanRepository.findByNovelIdOrderByChapterRangeStartAsc(novel.getId());
        List<ChapterPlan> matchingPlans = plans.stream()
                .filter(p -> p.getChapterRangeStart() <= chapterNumber
                        && p.getChapterRangeEnd() >= chapterNumber)
                .collect(Collectors.toList());
        if (!matchingPlans.isEmpty()) {
            sb.append("\n=== 本章计划 ===\n");
            for (ChapterPlan plan : matchingPlans) {
                if (plan.getOutline() != null && !plan.getOutline().isEmpty()) {
                    sb.append("大纲指导：").append(plan.getOutline()).append("\n");
                }
                if (plan.getNotes() != null && !plan.getNotes().isEmpty()) {
                    sb.append("备注：").append(plan.getNotes()).append("\n");
                }
            }
        }

        List<Synopsis> synopses = synopsisRepository.findByNovelIdOrderByChapterRangeStartAsc(novel.getId());
        if (!synopses.isEmpty()) {
            List<Synopsis> priorSynopses = synopses.stream()
                    .filter(s -> s.getChapterRangeEnd() < chapterNumber)
                    .collect(Collectors.toList());
            if (!priorSynopses.isEmpty()) {
                sb.append("\n=== 前章摘要 ===\n");
                for (Synopsis s : priorSynopses) {
                    sb.append("第").append(s.getChapterRangeStart()).append("-")
                            .append(s.getChapterRangeEnd()).append("章：")
                            .append(s.getContent()).append("\n");
                }
            }
        }

        String chapterTitle = "第" + chapterNumber + "章";
        Chapter existingChapter = chapterRepository.findByNovelIdAndChapterNumber(novel.getId(), chapterNumber)
                .orElse(null);
        if (existingChapter != null && existingChapter.getTitle() != null
                && !existingChapter.getTitle().isEmpty()) {
            chapterTitle = existingChapter.getTitle();
        }

        AIConfig config = aiConfigRepository.findById(1L).orElse(null);
        int targetWords = config != null ? config.getChapterWordCount() : 3000;

        sb.append("\n=== 写作要求 ===\n");
        sb.append("章节：").append(chapterTitle).append("\n");
        sb.append("目标字数：约").append(targetWords).append("字\n");
        sb.append("请直接开始写正文内容。\n");

        return sb.toString();
    }

    private void sendSseEvent(SseEmitter emitter, String event, Object data) throws Exception {
        String json = objectMapper.writeValueAsString(data);
        emitter.send(SseEmitter.event().name(event).data(json));
    }

    private void sendSseSilent(SseEmitter emitter, String event, Object data) {
        try {
            sendSseEvent(emitter, event, data);
        } catch (Exception ignored) {}
    }
}
