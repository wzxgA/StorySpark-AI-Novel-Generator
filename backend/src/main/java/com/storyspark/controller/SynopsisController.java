package com.storyspark.controller;

import com.storyspark.model.entity.Synopsis;
import com.storyspark.service.SynopsisService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novels/{novelId}/synopses")
public class SynopsisController {

    private final SynopsisService synopsisService;

    public SynopsisController(SynopsisService synopsisService) {
        this.synopsisService = synopsisService;
    }

    @GetMapping
    public List<Synopsis> list(@PathVariable Long novelId) {
        return synopsisService.findByNovelId(novelId);
    }

    @GetMapping("/{id}")
    public Synopsis get(@PathVariable Long novelId, @PathVariable Long id) {
        return synopsisService.findById(novelId, id);
    }

    @PostMapping
    public ResponseEntity<Synopsis> create(@PathVariable Long novelId, @RequestBody Synopsis entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(synopsisService.create(novelId, entity));
    }

    @PutMapping("/{id}")
    public Synopsis update(@PathVariable Long novelId, @PathVariable Long id, @RequestBody Synopsis entity) {
        return synopsisService.update(novelId, id, entity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long novelId, @PathVariable Long id) {
        synopsisService.delete(novelId, id);
        return ResponseEntity.noContent().build();
    }
}
