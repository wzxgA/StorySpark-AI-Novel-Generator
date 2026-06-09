package com.storyspark.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.storyspark.model.enums.SynopsisType;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "synopses")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({"novel", "hibernateLazyInitializer"})
public class Synopsis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "novel_id", nullable = false)
    private Novel novel;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private int chapterRangeStart;

    @Column(nullable = false)
    private int chapterRangeEnd;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SynopsisType summaryType = SynopsisType.MANUAL;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    public Synopsis() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Novel getNovel() { return novel; }
    public void setNovel(Novel novel) { this.novel = novel; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getChapterRangeStart() { return chapterRangeStart; }
    public void setChapterRangeStart(int chapterRangeStart) { this.chapterRangeStart = chapterRangeStart; }

    public int getChapterRangeEnd() { return chapterRangeEnd; }
    public void setChapterRangeEnd(int chapterRangeEnd) { this.chapterRangeEnd = chapterRangeEnd; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public SynopsisType getSummaryType() { return summaryType; }
    public void setSummaryType(SynopsisType summaryType) { this.summaryType = summaryType; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
