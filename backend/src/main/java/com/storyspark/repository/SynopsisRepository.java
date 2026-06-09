package com.storyspark.repository;

import com.storyspark.model.entity.Synopsis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SynopsisRepository extends JpaRepository<Synopsis, Long> {
    List<Synopsis> findByNovelIdOrderByChapterRangeStartAsc(Long novelId);
    List<Synopsis> findByNovelIdAndSummaryLevelOrderByChapterRangeStartAsc(Long novelId, int summaryLevel);
}
