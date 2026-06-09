package com.storyspark.model.dto;

import com.storyspark.model.enums.NovelStatus;
import java.time.Instant;

public class NovelDTO {

    private Long id;
    private String title;
    private String description;
    private NovelStatus status;
    private int chapterCount;
    private int characterCount;
    private int itemCount;
    private int worldBuildingCount;
    private Instant createdAt;
    private Instant updatedAt;

    public NovelDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public NovelStatus getStatus() { return status; }
    public void setStatus(NovelStatus status) { this.status = status; }

    public int getChapterCount() { return chapterCount; }
    public void setChapterCount(int chapterCount) { this.chapterCount = chapterCount; }

    public int getCharacterCount() { return characterCount; }
    public void setCharacterCount(int characterCount) { this.characterCount = characterCount; }

    public int getItemCount() { return itemCount; }
    public void setItemCount(int itemCount) { this.itemCount = itemCount; }

    public int getWorldBuildingCount() { return worldBuildingCount; }
    public void setWorldBuildingCount(int worldBuildingCount) { this.worldBuildingCount = worldBuildingCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
