package com.storyspark.controller;

import com.storyspark.model.entity.Item;
import com.storyspark.service.ItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novels/{novelId}/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    public List<Item> list(@PathVariable Long novelId) {
        return itemService.findByNovelId(novelId);
    }

    @GetMapping("/{id}")
    public Item get(@PathVariable Long novelId, @PathVariable Long id) {
        return itemService.findById(novelId, id);
    }

    @PostMapping
    public ResponseEntity<Item> create(@PathVariable Long novelId, @RequestBody Item entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemService.create(novelId, entity));
    }

    @PutMapping("/{id}")
    public Item update(@PathVariable Long novelId, @PathVariable Long id, @RequestBody Item entity) {
        return itemService.update(novelId, id, entity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long novelId, @PathVariable Long id) {
        itemService.delete(novelId, id);
        return ResponseEntity.noContent().build();
    }
}
