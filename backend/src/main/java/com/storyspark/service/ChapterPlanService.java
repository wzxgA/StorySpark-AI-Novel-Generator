package com.storyspark.service;

import com.storyspark.model.dto.ChapterPlanDTO;
import com.storyspark.model.entity.ChapterPlan;
import com.storyspark.model.entity.Novel;
import com.storyspark.repository.ChapterPlanRepository;
import com.storyspark.repository.NovelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class ChapterPlanService {

    private final ChapterPlanRepository chapterPlanRepository;
    private final NovelRepository novelRepository;

    public ChapterPlanService(ChapterPlanRepository chapterPlanRepository, NovelRepository novelRepository) {
        this.chapterPlanRepository = chapterPlanRepository;
        this.novelRepository = novelRepository;
    }

    @Transactional(readOnly = true)
    public List<ChapterPlanDTO> findByNovelId(Long novelId) {
        return chapterPlanRepository.findByNovelIdOrderByChapterRangeStartAsc(novelId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChapterPlanDTO findById(Long novelId, Long id) {
        ChapterPlan plan = chapterPlanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ChapterPlan not found"));
        if (!plan.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ChapterPlan not found in this novel");
        }
        return toDTO(plan);
    }

    public ChapterPlanDTO create(Long novelId, ChapterPlanDTO dto) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
        ChapterPlan plan = new ChapterPlan();
        plan.setNovel(novel);
        applyDTO(plan, dto);
        plan = chapterPlanRepository.save(plan);
        return toDTO(plan);
    }

    public ChapterPlanDTO update(Long novelId, Long id, ChapterPlanDTO dto) {
        ChapterPlan plan = chapterPlanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ChapterPlan not found"));
        if (!plan.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ChapterPlan not found in this novel");
        }
        applyDTO(plan, dto);
        plan = chapterPlanRepository.save(plan);
        return toDTO(plan);
    }

    public void delete(Long novelId, Long id) {
        ChapterPlan plan = chapterPlanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ChapterPlan not found"));
        if (!plan.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ChapterPlan not found in this novel");
        }
        chapterPlanRepository.delete(plan);
    }

    private ChapterPlanDTO toDTO(ChapterPlan plan) {
        ChapterPlanDTO dto = new ChapterPlanDTO();
        dto.setId(plan.getId());
        dto.setNovelId(plan.getNovel().getId());
        dto.setChapterRangeStart(plan.getChapterRangeStart());
        dto.setChapterRangeEnd(plan.getChapterRangeEnd());
        dto.setOutline(plan.getOutline());
        dto.setCharacterIds(plan.getCharacterIds());
        dto.setItemIds(plan.getItemIds());
        dto.setWorldBuildingIds(plan.getWorldBuildingIds());
        dto.setNotes(plan.getNotes());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setUpdatedAt(plan.getUpdatedAt());
        return dto;
    }

    private void applyDTO(ChapterPlan plan, ChapterPlanDTO dto) {
        if (dto.getChapterRangeStart() > 0) plan.setChapterRangeStart(dto.getChapterRangeStart());
        if (dto.getChapterRangeEnd() > 0) plan.setChapterRangeEnd(dto.getChapterRangeEnd());
        plan.setOutline(dto.getOutline());
        plan.setCharacterIds(dto.getCharacterIds());
        plan.setItemIds(dto.getItemIds());
        plan.setWorldBuildingIds(dto.getWorldBuildingIds());
        plan.setNotes(dto.getNotes());
    }
}
