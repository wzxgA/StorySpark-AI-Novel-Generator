package com.storyspark.controller;

import com.storyspark.model.entity.AIConfig;
import com.storyspark.service.AIConfigService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai-config")
public class AIConfigController {

    private final AIConfigService aiConfigService;

    public AIConfigController(AIConfigService aiConfigService) {
        this.aiConfigService = aiConfigService;
    }

    @GetMapping
    public AIConfig get() {
        return aiConfigService.getConfig();
    }

    @PutMapping
    public AIConfig update(@RequestBody AIConfig config) {
        return aiConfigService.saveConfig(config);
    }

    @PostMapping("/test")
    public Map<String, Object> testConnection(@RequestBody AIConfig config) {
        return aiConfigService.testConnection(config);
    }
}
