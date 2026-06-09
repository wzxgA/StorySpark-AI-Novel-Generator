package com.storyspark.repository;

import com.storyspark.model.entity.AIConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AIConfigRepository extends JpaRepository<AIConfig, Long> {
}
