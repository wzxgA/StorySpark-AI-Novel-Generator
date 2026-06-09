package com.storyspark.repository;

import com.storyspark.model.entity.Outline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OutlineRepository extends JpaRepository<Outline, Long> {
    Optional<Outline> findByNovelId(Long novelId);
}
