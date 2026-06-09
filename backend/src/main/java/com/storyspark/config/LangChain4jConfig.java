package com.storyspark.config;

import com.storyspark.model.entity.AIConfig;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;

import java.time.Duration;

public class LangChain4jConfig {

    private LangChain4jConfig() {}

    public static StreamingChatLanguageModel createStreamingModel(AIConfig config) {
        return OpenAiStreamingChatModel.builder()
                .baseUrl(config.getApiUrl())
                .apiKey(config.getApiKey())
                .modelName(config.getModel())
                .temperature(config.getTemperature())
                .maxTokens(config.getMaxTokens())
                .timeout(Duration.ofSeconds(120))
                .build();
    }
}
