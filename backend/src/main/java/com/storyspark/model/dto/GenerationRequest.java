package com.storyspark.model.dto;

/**
 * Placeholder for Phase 3 AI generation. Defines the shape of a generation request.
 */
public class GenerationRequest {

    private Long novelId;
    private int startChapter;
    private int endChapter;
    private String model;
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
