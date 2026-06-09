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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class AIGenerationService {

    private static final Logger log = LoggerFactory.getLogger(AIGenerationService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
            你是专业小说家。请严格按照以下设定和指引创作章节内容：

            ## 核心约束
            - 保持角色性格和行为一致：角色言行必须符合其已设定的性格特征、动机和关系
            - 严格遵循世界观设定：不添加矛盾的设定，不自行修改或推翻已有世界观
            - 时间线一致性：事件顺序合理，前后时间线不冲突，注意章节间的时间衔接
            - 场景不冲突：地点、环境描述与已建立的世界观一致

            ## 创作规范
            - 按照大纲推动剧情发展，合理安排剧情节奏
            - 使用 Markdown 格式书写，适当使用标题和段落
            - 内容生动详实，注重细节描写
            - 对话自然流畅，符合角色性格

            ## 自动创建规则
            - 如果剧情需要引入新角色，请为该角色命名并提供简短描述（格式：【新角色】名称：描述）
            - 如果剧情需要重要物品，请注明（格式：【新物品】名称：描述）
            - 如果剧情涉及新的世界观设定，请注明（格式：【新设定】标题：内容）
            - 这些标记将帮助系统自动记录新添加的要素

            ## 输出规范
            - 直接输出章节正文，不要添加额外说明（新角色/物品/设定标记除外）
            - 章节标题请使用 Markdown 一级标题格式：# 第X章 章节名""";

    private final AIConfigRepository aiConfigRepository;
    private final NovelRepository novelRepository;
    private final ChapterRepository chapterRepository;
    private final ContextManager contextManager;
    private final Summarizer summarizer;

    public AIGenerationService(AIConfigRepository aiConfigRepository, NovelRepository novelRepository,
                               ChapterRepository chapterRepository,
                               ContextManager contextManager, Summarizer summarizer) {
        this.aiConfigRepository = aiConfigRepository;
        this.novelRepository = novelRepository;
        this.chapterRepository = chapterRepository;
        this.contextManager = contextManager;
        this.summarizer = summarizer;
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
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new RuntimeException("Novel not found"));

        Chapter chapter = chapterRepository.findFirstByNovelIdAndChapterNumber(novelId, chapterNumber)
                .orElse(null);

        generateOneChapter(novel, chapterNumber, chapter, emitter, () -> emitter.complete(), ChapterStatus.COMPLETED, new AtomicBoolean(true));
    }

    /**
     * Batch generate chapters from startChapter to endChapter (inclusive).
     */
    public void batchGenerate(Long novelId, int startChapter, int endChapter, SseEmitter emitter) {
        AtomicBoolean cancelled = new AtomicBoolean(false);
        emitter.onCompletion(() -> cancelled.set(true));
        emitter.onError(e -> cancelled.set(true));
        emitter.onTimeout(() -> cancelled.set(true));

        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new RuntimeException("Novel not found"));

        int totalChapters = endChapter - startChapter + 1;
        int completedChapters = 0;

        try {
            sendSseEvent(emitter, "batch-start", Map.of(
                    "startChapter", startChapter,
                    "endChapter", endChapter,
                    "totalChapters", totalChapters
            ));
        } catch (Exception e) {
            log.error("Failed to send batch-start", e);
            emitter.complete();
            return;
        }

        for (int chapterNumber = startChapter; chapterNumber <= endChapter; chapterNumber++) {
            if (cancelled.get()) break;

            Chapter chapter = chapterRepository.findFirstByNovelIdAndChapterNumber(novelId, chapterNumber)
                    .orElse(null);

            if (chapter == null) {
                chapter = new Chapter();
                chapter.setNovel(novel);
                chapter.setChapterNumber(chapterNumber);
                chapter.setTitle("第" + chapterNumber + "章");
                chapter.setStatus(ChapterStatus.DRAFT);
                chapter = chapterRepository.save(chapter);
            }

            try {
                sendSseEvent(emitter, "chapter-start", Map.of(
                        "chapterId", chapter.getId(),
                        "chapterNumber", chapterNumber
                ));
            } catch (Exception ignored) {
                if (cancelled.get()) break;
            }

            // Use CountDownLatch to wait for this single chapter to complete
            CountDownLatch chapterLatch = new CountDownLatch(1);

            int finalChapterNumber = chapterNumber;
            Chapter finalChapter = chapter;
            AtomicBoolean chapterSuccess = new AtomicBoolean(false);
            generateOneChapter(novel, chapterNumber, chapter, emitter, () -> {
                chapterLatch.countDown();
            }, ChapterStatus.DRAFT, chapterSuccess);

            try {
                chapterLatch.await(300, java.util.concurrent.TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }

            // Only send chapter-done if generation actually succeeded
            if (!chapterSuccess.get()) continue;

            completedChapters++;

            try {
                sendSseEvent(emitter, "chapter-done", Map.of(
                        "chapterId", finalChapter.getId(),
                        "chapterNumber", finalChapterNumber,
                        "title", finalChapter.getTitle() != null ? finalChapter.getTitle() : "",
                        "content", finalChapter.getContent() != null ? finalChapter.getContent() : "",
                        "wordCount", finalChapter.getWordCount(),
                        "completedCount", completedChapters,
                        "totalCount", totalChapters
                ));
            } catch (Exception ignored) {
                if (cancelled.get()) break;
            }
        }

        // Auto-summarize after batch completion
        try {
            summarizer.summarizeAfterBatch(novelId, novel, endChapter);
        } catch (Exception e) {
            log.error("Auto-summary failed after batch generate for novel {}", novelId, e);
        }

        try {
            sendSseEvent(emitter, "batch-done", Map.of(
                    "totalChapters", totalChapters,
                    "completedChapters", completedChapters
            ));
        } catch (Exception ignored) {}
        emitter.complete();
    }

    /**
     * Core generation logic for one chapter. Calls onChapterComplete when done (via SSE or error).
     */
    private void generateOneChapter(Novel novel, int chapterNumber, Chapter chapter,
                                     SseEmitter emitter, Runnable onChapterComplete,
                                     ChapterStatus targetStatus, AtomicBoolean successFlag) {
        AtomicBoolean cancelled = new AtomicBoolean(false);

        AIConfig config = aiConfigRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("AI config not found"));

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

                            // Save chapter first (SSE send may fail if emitter already completed)
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
                                ch.setStatus(targetStatus);
                                chapterRepository.save(ch);
                            } catch (Exception e) {
                                log.error("Failed to save chapter {}", chapterNumber, e);
                            }

                            // SSE event is best-effort: emitter may have completed already
                            sendSseSilent(emitter, "done", Map.of(
                                    "chapterId", chapter != null ? chapter.getId() : 0,
                                    "wordCount", wordCount
                            ));
                            successFlag.set(true);
                            onChapterComplete.run();
                        }

                        @Override
                        public void onError(Throwable error) {
                            log.error("Generation error for chapter {}", chapterNumber, error);
                            sendSseSilent(emitter, "error", Map.of(
                                    "message", error.getMessage(),
                                    "chapterNumber", chapterNumber
                            ));
                            onChapterComplete.run();
                        }
                    });
        } catch (Exception e) {
            log.error("Failed to start generation for chapter {}", chapterNumber, e);
            sendSseSilent(emitter, "error", Map.of(
                    "message", e.getMessage(),
                    "chapterNumber", chapterNumber
            ));
            onChapterComplete.run();
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
        ContextManager.ContextAssembly assembly = contextManager.buildContext(novel, chapterNumber);
        log.info("Chapter {}: {} tokens / {} budget, {} recent chapters included",
                chapterNumber, assembly.getTotalTokensUsed(), assembly.getBudgetLimit(),
                assembly.getRecentChapterCount());
        return assembly.getFullUserPrompt();
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
