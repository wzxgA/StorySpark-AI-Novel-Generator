package com.storyspark.repository;

import com.storyspark.model.entity.WorldBuilding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorldBuildingRepository extends JpaRepository<WorldBuilding, Long> {
    List<WorldBuilding> findByNovelId(Long novelId);
    long countByNovelId(Long novelId);
}
