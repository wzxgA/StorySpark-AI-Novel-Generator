package com.storyspark.model.dto;

import com.storyspark.model.enums.ChapterStatus;
import java.time.Instant;

public class ChapterDTO {

    private Long id;
    private Long novelId;
    private int chapterNumber;
    private String title;
    private String content;
    private int wordCount;
    private ChapterStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public ChapterDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNovelId() { return novelId; }
    public void setNovelId(Long novelId) { this.novelId = novelId; }

    public int getChapterNumber() { return chapterNumber; }
    public void setChapterNumber(int chapterNumber) { this.chapterNumber = chapterNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getWordCount() { return wordCount; }
    public void setWordCount(int wordCount) { this.wordCount = wordCount; }

    public ChapterStatus getStatus() { return status; }
    public void setStatus(ChapterStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
