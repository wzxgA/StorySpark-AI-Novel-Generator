package com.storyspark.repository;

import com.storyspark.model.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByNovelIdOrderByChapterNumberAsc(Long novelId);
    boolean existsByNovelIdAndChapterNumber(Long novelId, int chapterNumber);
    long countByNovelId(Long novelId);
}
