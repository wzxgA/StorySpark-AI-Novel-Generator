package com.storyspark.model.dto;

import java.time.Instant;

public class ChapterPlanDTO {

    private Long id;
    private Long novelId;
    private int chapterRangeStart;
    private int chapterRangeEnd;
    private String outline;
    private String characterIds;
    private String itemIds;
    private String worldBuildingIds;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public ChapterPlanDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNovelId() { return novelId; }
    public void setNovelId(Long novelId) { this.novelId = novelId; }

    public int getChapterRangeStart() { return chapterRangeStart; }
    public void setChapterRangeStart(int chapterRangeStart) { this.chapterRangeStart = chapterRangeStart; }

    public int getChapterRangeEnd() { return chapterRangeEnd; }
    public void setChapterRangeEnd(int chapterRangeEnd) { this.chapterRangeEnd = chapterRangeEnd; }

    public String getOutline() { return outline; }
    public void setOutline(String outline) { this.outline = outline; }

    public String getCharacterIds() { return characterIds; }
    public void setCharacterIds(String characterIds) { this.characterIds = characterIds; }

    public String getItemIds() { return itemIds; }
    public void setItemIds(String itemIds) { this.itemIds = itemIds; }

    public String getWorldBuildingIds() { return worldBuildingIds; }
    public void setWorldBuildingIds(String worldBuildingIds) { this.worldBuildingIds = worldBuildingIds; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
