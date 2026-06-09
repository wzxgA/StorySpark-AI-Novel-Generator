package com.storyspark.controller;

import com.storyspark.model.dto.GenerationRequest;
import com.storyspark.model.entity.Chapter;
import com.storyspark.model.enums.ChapterStatus;
import com.storyspark.repository.ChapterRepository;
import com.storyspark.service.AIGenerationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/novels/{novelId}")
public class AIGenerationController {

    private final AIGenerationService aiGenerationService;
    private final ChapterRepository chapterRepository;

    public AIGenerationController(AIGenerationService aiGenerationService,
                                  ChapterRepository chapterRepository) {
        this.aiGenerationService = aiGenerationService;
        this.chapterRepository = chapterRepository;
    }

    /**
     * Generate content for an existing chapter via SSE streaming.
     */
    @PostMapping("/chapters/{chapterId}/generate")
    public SseEmitter generateExistingChapter(
            @PathVariable Long novelId,
            @PathVariable Long chapterId,
            @RequestParam(defaultValue = "0") int wordCount) {

        SseEmitter emitter = new SseEmitter(300000L); // 5-minute timeout
        aiGenerationService.generateForChapter(novelId, chapterId, emitter);
        return emitter;
    }

    /**
     * Generate a new chapter by chapter number via SSE streaming.
     */
    @PostMapping("/chapters/generate-new")
    public SseEmitter generateNewChapter(
            @PathVariable Long novelId,
            @RequestParam int chapterNumber) {

        SseEmitter emitter = new SseEmitter(300000L);
        aiGenerationService.generateSingleChapter(novelId, chapterNumber, emitter);
        return emitter;
    }

    /**
     * Batch generate chapters from startChapter to endChapter via SSE streaming.
     */
    @PostMapping("/chapters/batch-generate")
    public SseEmitter batchGenerate(
            @PathVariable Long novelId,
            @RequestBody GenerationRequest request) {

        SseEmitter emitter = new SseEmitter(600000L); // 10-minute timeout
        aiGenerationService.batchGenerate(novelId, request.getStartChapter(), request.getEndChapter(), emitter);
        return emitter;
    }

    /**
     * Confirm a batch-generated chapter (DRAFT → COMPLETED).
     * Optionally accepts content/wordCount as a safety net in case
     * the streaming onComplete didn't persist them.
     */
    @PostMapping("/chapters/{chapterId}/confirm")
    public ResponseEntity<?> confirmChapter(
            @PathVariable Long novelId,
            @PathVariable Long chapterId,
            @RequestBody(required = false) Map<String, Object> body) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found: " + chapterId));
        chapter.setStatus(ChapterStatus.COMPLETED);
        // Safety net: persist content if streaming save didn't
        if (body != null) {
            if (body.get("content") instanceof String c && !c.isEmpty()
                    && (chapter.getContent() == null || chapter.getContent().isEmpty())) {
                chapter.setContent(c);
            }
            if (body.get("wordCount") instanceof Number wc
                    && chapter.getWordCount() == 0) {
                chapter.setWordCount(wc.intValue());
            }
        }
        chapterRepository.save(chapter);
        return ResponseEntity.ok(Map.of("status", "confirmed"));
    }

    /**
     * Discard a batch-generated chapter.
     */
    @DeleteMapping("/chapters/{chapterId}/discard")
    public ResponseEntity<?> discardChapter(
            @PathVariable Long novelId,
            @PathVariable Long chapterId) {
        chapterRepository.deleteById(chapterId);
        return ResponseEntity.noContent().build();
    }
}
