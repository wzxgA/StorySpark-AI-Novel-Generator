package com.storyspark.service;

import org.springframework.stereotype.Component;

@Component
public class TokenCounter {

    private static final double CHINESE_CHARS_PER_TOKEN = 1.5;
    private static final double ENGLISH_CHARS_PER_TOKEN = 4.0;
    private static final double MIXED_CHARS_PER_TOKEN = 3.0;
    private static final int DEFAULT_CONTEXT_WINDOW = 128_000;

    public int estimateTokens(String text) {
        if (text == null || text.isEmpty()) return 0;

        int chineseChars = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if ((c >= '一' && c <= '鿿')
                    || (c >= '㐀' && c <= '䶿')
                    || (c >= '豈' && c <= '﫿')) {
                chineseChars++;
            }
        }

        int total = text.length();
        double ratio = (double) chineseChars / total;

        double charsPerToken;
        if (ratio > 0.3) {
            charsPerToken = CHINESE_CHARS_PER_TOKEN;
        } else if (ratio < 0.1) {
            charsPerToken = ENGLISH_CHARS_PER_TOKEN;
        } else {
            charsPerToken = MIXED_CHARS_PER_TOKEN;
        }

        return Math.max(1, (int) (total / charsPerToken));
    }

    public int getContextWindowSize(String modelName) {
        if (modelName == null) return DEFAULT_CONTEXT_WINDOW;
        String m = modelName.toLowerCase();

        if (m.contains("gpt-4-32k")) return 32768;
        if (m.contains("gpt-4")) return 128_000;
        if (m.contains("gpt-3.5-turbo-16k")) return 16384;
        if (m.contains("gpt-3.5")) return 4096;
        if (m.contains("deepseek")) return 128_000;
        if (m.contains("claude")) return 200_000;
        if (m.contains("qwen")) return 32768;
        if (m.contains("llama3-70b") || m.contains("llama3-405b")) return 128_000;
        if (m.contains("llama")) return 8192;

        return DEFAULT_CONTEXT_WINDOW;
    }

    public int getBudgetLimit(String modelName) {
        return (int) (getContextWindowSize(modelName) * 0.75);
    }
}
