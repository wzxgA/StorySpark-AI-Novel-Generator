package com.storyspark.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class GenerationRequest {

    @NotNull
    private Long novelId;

    @Min(1)
    private int startChapter;

    @Min(1)
    private int endChapter;

    private String model;

    @Min(100)
    private int wordCount;

    public GenerationRequest() {}

    public Long getNovelId() { return novelId; }
    public void setNovelId(Long novelId) { this.novelId = novelId; }

    public int getStartChapter() { return startChapter; }
    public void setStartChapter(int startChapter) { this.startChapter = startChapter; }

    public int getEndChapter() { return endChapter; }
    public void setEndChapter(int endChapter) { this.endChapter = endChapter; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getWordCount() { return wordCount; }
    public void setWordCount(int wordCount) { this.wordCount = wordCount; }
}
