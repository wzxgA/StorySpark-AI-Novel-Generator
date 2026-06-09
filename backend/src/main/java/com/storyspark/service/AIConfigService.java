package com.storyspark.service;

import com.storyspark.config.EncryptionUtil;
import com.storyspark.model.entity.AIConfig;
import com.storyspark.repository.AIConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
@Transactional
public class AIConfigService {

    private final AIConfigRepository aiConfigRepository;

    public AIConfigService(AIConfigRepository aiConfigRepository) {
        this.aiConfigRepository = aiConfigRepository;
    }

    @Transactional(readOnly = true)
    public AIConfig getConfig() {
        return aiConfigRepository.findById(1L)
                .map(this::decryptConfig)
                .orElseGet(() -> {
                    AIConfig config = new AIConfig();
                    config.setId(1L);
                    config = aiConfigRepository.save(config);
                    return config;
                });
    }

    public AIConfig saveConfig(AIConfig updated) {
        AIConfig config = aiConfigRepository.findById(1L).orElseGet(AIConfig::new);
        config.setId(1L);

        if (updated.getApiUrl() != null) config.setApiUrl(updated.getApiUrl());
        if (updated.getApiKey() != null && !updated.getApiKey().isEmpty()) {
            // Encrypt the API key before storing. If the key appears already encrypted
            // (i.e. unchanged placeholder from frontend), the frontend will send the
            // previously decrypted value. We re-encrypt it here.
            if (!updated.getApiKey().equals(config.getApiKey())) {
                config.setApiKey(EncryptionUtil.encrypt(updated.getApiKey()));
            }
        }
        if (updated.getModel() != null) config.setModel(updated.getModel());
        if (updated.getChapterWordCount() > 0) config.setChapterWordCount(updated.getChapterWordCount());
        config.setTemperature(updated.getTemperature());
        if (updated.getMaxTokens() > 0) config.setMaxTokens(updated.getMaxTokens());

        config = aiConfigRepository.save(config);
        return decryptConfig(config);
    }

    public Map<String, Object> testConnection(AIConfig testConfig) {
        String url = testConfig.getApiUrl();
        String key = testConfig.getApiKey();

        if (url == null || url.isBlank()) {
            return Map.of("success", false, "message", "API URL is required");
        }
        if (key == null || key.isBlank()) {
            return Map.of("success", false, "message", "API Key is required");
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url + "/models"))
                    .header("Authorization", "Bearer " + key)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 || response.statusCode() == 401) {
                // 401 means the URL is reachable but key is invalid — connection works
                return Map.of("success", true, "message",
                        response.statusCode() == 200 ? "Connection successful" : "Server reachable (check API key)");
            }
            return Map.of("success", false, "message", "Server returned status: " + response.statusCode());
        } catch (Exception e) {
            return Map.of("success", false, "message", "Connection failed: " + e.getMessage());
        }
    }

    private AIConfig decryptConfig(AIConfig config) {
        try {
            if (config.getApiKey() != null && !config.getApiKey().isEmpty()) {
                config.setApiKey(EncryptionUtil.decrypt(config.getApiKey()));
            }
        } catch (Exception e) {
            // If decryption fails, return the raw value
        }
        return config;
    }
}
