package com.storyspark.controller;

import com.storyspark.model.entity.WorldBuilding;
import com.storyspark.service.WorldBuildingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novels/{novelId}/worldbuilding")
public class WorldBuildingController {

    private final WorldBuildingService worldBuildingService;

    public WorldBuildingController(WorldBuildingService worldBuildingService) {
        this.worldBuildingService = worldBuildingService;
    }

    @GetMapping
    public List<WorldBuilding> list(@PathVariable Long novelId) {
        return worldBuildingService.findByNovelId(novelId);
    }

    @GetMapping("/{id}")
    public WorldBuilding get(@PathVariable Long novelId, @PathVariable Long id) {
        return worldBuildingService.findById(novelId, id);
    }

    @PostMapping
    public ResponseEntity<WorldBuilding> create(@PathVariable Long novelId, @RequestBody WorldBuilding entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(worldBuildingService.create(novelId, entity));
    }

    @PutMapping("/{id}")
    public WorldBuilding update(@PathVariable Long novelId, @PathVariable Long id, @RequestBody WorldBuilding entity) {
        return worldBuildingService.update(novelId, id, entity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long novelId, @PathVariable Long id) {
        worldBuildingService.delete(novelId, id);
        return ResponseEntity.noContent().build();
    }
}
