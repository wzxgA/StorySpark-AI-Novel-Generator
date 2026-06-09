package com.storyspark.controller;

import com.storyspark.model.entity.Character;
import com.storyspark.service.CharacterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novels/{novelId}/characters")
public class CharacterController {

    private final CharacterService characterService;

    public CharacterController(CharacterService characterService) {
        this.characterService = characterService;
    }

    @GetMapping
    public List<Character> list(@PathVariable Long novelId) {
        return characterService.findByNovelId(novelId);
    }

    @GetMapping("/{id}")
    public Character get(@PathVariable Long novelId, @PathVariable Long id) {
        return characterService.findById(novelId, id);
    }

    @PostMapping
    public ResponseEntity<Character> create(@PathVariable Long novelId, @RequestBody Character entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(characterService.create(novelId, entity));
    }

    @PutMapping("/{id}")
    public Character update(@PathVariable Long novelId, @PathVariable Long id, @RequestBody Character entity) {
        return characterService.update(novelId, id, entity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long novelId, @PathVariable Long id) {
        characterService.delete(novelId, id);
        return ResponseEntity.noContent().build();
    }
}
