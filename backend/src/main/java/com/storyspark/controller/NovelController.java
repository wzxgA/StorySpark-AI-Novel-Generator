package com.storyspark.controller;

import com.storyspark.model.dto.NovelDTO;
import com.storyspark.service.NovelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novels")
public class NovelController {

    private final NovelService novelService;

    public NovelController(NovelService novelService) {
        this.novelService = novelService;
    }

    @GetMapping
    public List<NovelDTO> list() {
        return novelService.findAll();
    }

    @GetMapping("/{id}")
    public NovelDTO get(@PathVariable Long id) {
        return novelService.findById(id);
    }

    @PostMapping
    public ResponseEntity<NovelDTO> create(@Valid @RequestBody NovelDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(novelService.create(dto));
    }

    @PutMapping("/{id}")
    public NovelDTO update(@PathVariable Long id, @Valid @RequestBody NovelDTO dto) {
        return novelService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        novelService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
