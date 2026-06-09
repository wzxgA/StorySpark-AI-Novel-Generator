package com.storyspark.controller;

import com.storyspark.service.AIGenerationService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

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

        // Determine chapter number from the chapter ID
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
}
