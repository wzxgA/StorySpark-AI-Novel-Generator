package com.storyspark.model.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "ai_config")
@EntityListeners(AuditingEntityListener.class)
public class AIConfig {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private String apiUrl = "https://api.openai.com/v1";

    @Column(columnDefinition = "TEXT")
    private String apiKey;

    @Column(nullable = false)
    private String model = "gpt-4o";

    @Column(nullable = false)
    private int chapterWordCount = 3000;

    @Column(nullable = false)
    private double temperature = 0.7;

    @Column(nullable = false)
    private int maxTokens = 4096;

    @LastModifiedDate
    private Instant updatedAt;

    public AIConfig() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApiUrl() { return apiUrl; }
    public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getChapterWordCount() { return chapterWordCount; }
    public void setChapterWordCount(int chapterWordCount) { this.chapterWordCount = chapterWordCount; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public int getMaxTokens() { return maxTokens; }
    public void setMaxTokens(int maxTokens) { this.maxTokens = maxTokens; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
