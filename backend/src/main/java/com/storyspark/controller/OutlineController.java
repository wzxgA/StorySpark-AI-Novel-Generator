package com.storyspark.controller;

import com.storyspark.model.entity.Outline;
import com.storyspark.service.OutlineService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/novels/{novelId}/outline")
public class OutlineController {

    private final OutlineService outlineService;

    public OutlineController(OutlineService outlineService) {
        this.outlineService = outlineService;
    }

    @GetMapping
    public Outline get(@PathVariable Long novelId) {
        return outlineService.getByNovelId(novelId);
    }

    @PutMapping
    public Outline update(@PathVariable Long novelId, @RequestBody Outline outline) {
        return outlineService.update(novelId, outline);
    }
}
