package com.storyspark.controller;

import com.storyspark.model.dto.ChapterDTO;
import com.storyspark.service.ChapterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novels/{novelId}/chapters")
public class ChapterController {

    private final ChapterService chapterService;

    public ChapterController(ChapterService chapterService) {
        this.chapterService = chapterService;
    }

    @GetMapping
    public List<ChapterDTO> list(@PathVariable Long novelId) {
        return chapterService.findByNovelId(novelId);
    }

    @GetMapping("/{id}")
    public ChapterDTO get(@PathVariable Long novelId, @PathVariable Long id) {
        return chapterService.findById(novelId, id);
    }

    @PostMapping
    public ResponseEntity<ChapterDTO> create(@PathVariable Long novelId, @Valid @RequestBody ChapterDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chapterService.create(novelId, dto));
    }

    @PutMapping("/{id}")
    public ChapterDTO update(@PathVariable Long novelId, @PathVariable Long id, @Valid @RequestBody ChapterDTO dto) {
        return chapterService.update(novelId, id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long novelId, @PathVariable Long id) {
        chapterService.delete(novelId, id);
        return ResponseEntity.noContent().build();
    }
}
