package com.storyspark.service;

import com.storyspark.model.entity.Novel;
import com.storyspark.model.entity.Outline;
import com.storyspark.repository.NovelRepository;
import com.storyspark.repository.OutlineRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OutlineService {

    private final OutlineRepository outlineRepository;
    private final NovelRepository novelRepository;

    public OutlineService(OutlineRepository outlineRepository, NovelRepository novelRepository) {
        this.outlineRepository = outlineRepository;
        this.novelRepository = novelRepository;
    }

    @Transactional(readOnly = true)
    public Outline getByNovelId(Long novelId) {
        return outlineRepository.findByNovelId(novelId)
                .orElseGet(() -> {
                    Novel novel = novelRepository.findById(novelId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
                    Outline outline = new Outline();
                    outline.setNovel(novel);
                    outline.setContent("");
                    return outlineRepository.save(outline);
                });
    }

    public Outline update(Long novelId, Outline updated) {
        Outline existing = outlineRepository.findByNovelId(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Outline not found"));
        if (updated.getContent() != null) {
            existing.setContent(updated.getContent());
        }
        return outlineRepository.save(existing);
    }
}
