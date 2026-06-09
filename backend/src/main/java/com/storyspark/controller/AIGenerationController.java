package com.storyspark.controller;

import com.storyspark.model.dto.GenerationRequest;
import com.storyspark.service.AIGenerationService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/novels/{novelId}")
public class AIGenerationController {

    private final AIGenerationService aiGenerationService;

    public AIGenerationController(AIGenerationService aiGenerationService) {
        this.aiGenerationService = aiGenerationService;
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
}
