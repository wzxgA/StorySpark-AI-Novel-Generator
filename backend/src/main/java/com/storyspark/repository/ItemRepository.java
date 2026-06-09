package com.storyspark.repository;

import com.storyspark.model.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByNovelId(Long novelId);
    long countByNovelId(Long novelId);
}
