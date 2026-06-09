package com.storyspark.service;

import com.storyspark.model.entity.Novel;
import com.storyspark.model.entity.WorldBuilding;
import com.storyspark.repository.NovelRepository;
import com.storyspark.repository.WorldBuildingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class WorldBuildingService {

    private final WorldBuildingRepository worldBuildingRepository;
    private final NovelRepository novelRepository;

    public WorldBuildingService(WorldBuildingRepository worldBuildingRepository, NovelRepository novelRepository) {
        this.worldBuildingRepository = worldBuildingRepository;
        this.novelRepository = novelRepository;
    }

    @Transactional(readOnly = true)
    public List<WorldBuilding> findByNovelId(Long novelId) {
        return worldBuildingRepository.findByNovelId(novelId);
    }

    @Transactional(readOnly = true)
    public WorldBuilding findById(Long novelId, Long id) {
        WorldBuilding wb = worldBuildingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "WorldBuilding not found"));
        if (!wb.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "WorldBuilding not found in this novel");
        }
        return wb;
    }

    public WorldBuilding create(Long novelId, WorldBuilding entity) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
        entity.setId(null);
        entity.setNovel(novel);
        return worldBuildingRepository.save(entity);
    }

    public WorldBuilding update(Long novelId, Long id, WorldBuilding entity) {
        WorldBuilding existing = worldBuildingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "WorldBuilding not found"));
        if (!existing.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "WorldBuilding not found in this novel");
        }
        existing.setTitle(entity.getTitle());
        existing.setContent(entity.getContent());
        existing.setCategory(entity.getCategory());
        return worldBuildingRepository.save(existing);
    }

    public void delete(Long novelId, Long id) {
        WorldBuilding wb = worldBuildingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "WorldBuilding not found"));
        if (!wb.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "WorldBuilding not found in this novel");
        }
        worldBuildingRepository.delete(wb);
    }
}
