package com.storyspark.repository;

import com.storyspark.model.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByNovelIdOrderByChapterNumberAsc(Long novelId);
    Optional<Chapter> findFirstByNovelIdAndChapterNumber(Long novelId, int chapterNumber);
    boolean existsByNovelIdAndChapterNumber(Long novelId, int chapterNumber);
    long countByNovelId(Long novelId);
}
