package com.storyspark.repository;

import com.storyspark.model.entity.ChapterPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterPlanRepository extends JpaRepository<ChapterPlan, Long> {
    List<ChapterPlan> findByNovelIdOrderByChapterRangeStartAsc(Long novelId);
}
