package com.storyspark.model.dto;

import jakarta.validation.constraints.Min;

public class GenerationRequest {

    @Min(1)
    private int startChapter;

    @Min(1)
    private int endChapter;

    public GenerationRequest() {}

    public int getStartChapter() { return startChapter; }
    public void setStartChapter(int startChapter) { this.startChapter = startChapter; }

    public int getEndChapter() { return endChapter; }
    public void setEndChapter(int endChapter) { this.endChapter = endChapter; }
}
