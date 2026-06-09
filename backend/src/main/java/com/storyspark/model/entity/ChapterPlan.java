package com.storyspark.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "chapter_plans")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({"novel", "hibernateLazyInitializer"})
public class ChapterPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "novel_id", nullable = false)
    private Novel novel;

    @Column(nullable = false)
    private int chapterRangeStart;

    @Column(nullable = false)
    private int chapterRangeEnd;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String outline;

    @Column(columnDefinition = "TEXT")
    private String characterIds;

    @Column(columnDefinition = "TEXT")
    private String itemIds;

    @Column(columnDefinition = "TEXT")
    private String worldBuildingIds;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public ChapterPlan() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Novel getNovel() { return novel; }
    public void setNovel(Novel novel) { this.novel = novel; }

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
