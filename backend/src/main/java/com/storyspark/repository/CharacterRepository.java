package com.storyspark.repository;

import com.storyspark.model.entity.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterRepository extends JpaRepository<Character, Long> {
    List<Character> findByNovelId(Long novelId);
    long countByNovelId(Long novelId);
}
