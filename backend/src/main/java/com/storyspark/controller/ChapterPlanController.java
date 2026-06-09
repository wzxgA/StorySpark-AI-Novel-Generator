package com.storyspark.controller;

import com.storyspark.model.dto.ChapterPlanDTO;
import com.storyspark.service.ChapterPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novels/{novelId}/chapter-plans")
public class ChapterPlanController {

    private final ChapterPlanService chapterPlanService;

    public ChapterPlanController(ChapterPlanService chapterPlanService) {
        this.chapterPlanService = chapterPlanService;
    }

    @GetMapping
    public List<ChapterPlanDTO> list(@PathVariable Long novelId) {
        return chapterPlanService.findByNovelId(novelId);
    }

    @GetMapping("/{id}")
    public ChapterPlanDTO get(@PathVariable Long novelId, @PathVariable Long id) {
        return chapterPlanService.findById(novelId, id);
    }

    @PostMapping
    public ResponseEntity<ChapterPlanDTO> create(@PathVariable Long novelId, @RequestBody ChapterPlanDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chapterPlanService.create(novelId, dto));
    }

    @PutMapping("/{id}")
    public ChapterPlanDTO update(@PathVariable Long novelId, @PathVariable Long id, @RequestBody ChapterPlanDTO dto) {
        return chapterPlanService.update(novelId, id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long novelId, @PathVariable Long id) {
        chapterPlanService.delete(novelId, id);
        return ResponseEntity.noContent().build();
    }
}
