package com.storyspark.service;

import com.storyspark.model.entity.Novel;
import com.storyspark.model.entity.Synopsis;
import com.storyspark.repository.NovelRepository;
import com.storyspark.repository.SynopsisRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class SynopsisService {

    private final SynopsisRepository synopsisRepository;
    private final NovelRepository novelRepository;

    public SynopsisService(SynopsisRepository synopsisRepository, NovelRepository novelRepository) {
        this.synopsisRepository = synopsisRepository;
        this.novelRepository = novelRepository;
    }

    @Transactional(readOnly = true)
    public List<Synopsis> findByNovelId(Long novelId) {
        return synopsisRepository.findByNovelIdOrderByChapterRangeStartAsc(novelId);
    }

    @Transactional(readOnly = true)
    public Synopsis findById(Long novelId, Long id) {
        Synopsis synopsis = synopsisRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Synopsis not found"));
        if (!synopsis.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Synopsis not found in this novel");
        }
        return synopsis;
    }

    public Synopsis create(Long novelId, Synopsis entity) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
        entity.setId(null);
        entity.setNovel(novel);
        return synopsisRepository.save(entity);
    }

    public Synopsis update(Long novelId, Long id, Synopsis entity) {
        Synopsis existing = synopsisRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Synopsis not found"));
        if (!existing.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Synopsis not found in this novel");
        }
        existing.setTitle(entity.getTitle());
        existing.setChapterRangeStart(entity.getChapterRangeStart());
        existing.setChapterRangeEnd(entity.getChapterRangeEnd());
        existing.setContent(entity.getContent());
        existing.setSummaryType(entity.getSummaryType());
        return synopsisRepository.save(existing);
    }

    public void delete(Long novelId, Long id) {
        Synopsis synopsis = synopsisRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Synopsis not found"));
        if (!synopsis.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Synopsis not found in this novel");
        }
        synopsisRepository.delete(synopsis);
    }
}
