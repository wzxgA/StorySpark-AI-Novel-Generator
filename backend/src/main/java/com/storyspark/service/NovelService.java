package com.storyspark.service;

import com.storyspark.model.dto.NovelDTO;
import com.storyspark.model.entity.Novel;
import com.storyspark.model.entity.Outline;
import com.storyspark.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class NovelService {

    private final NovelRepository novelRepository;
    private final ChapterRepository chapterRepository;
    private final CharacterRepository characterRepository;
    private final ItemRepository itemRepository;
    private final WorldBuildingRepository worldBuildingRepository;
    private final OutlineRepository outlineRepository;

    public NovelService(NovelRepository novelRepository, ChapterRepository chapterRepository,
                        CharacterRepository characterRepository, ItemRepository itemRepository,
                        WorldBuildingRepository worldBuildingRepository, OutlineRepository outlineRepository) {
        this.novelRepository = novelRepository;
        this.chapterRepository = chapterRepository;
        this.characterRepository = characterRepository;
        this.itemRepository = itemRepository;
        this.worldBuildingRepository = worldBuildingRepository;
        this.outlineRepository = outlineRepository;
    }

    @Transactional(readOnly = true)
    public List<NovelDTO> findAll() {
        return novelRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public NovelDTO findById(Long id) {
        Novel novel = novelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
        return toDTO(novel);
    }

    public NovelDTO create(NovelDTO dto) {
        Novel novel = new Novel();
        applyDTO(novel, dto);
        novel = novelRepository.save(novel);

        // Auto-create an empty outline for the novel
        Outline outline = new Outline();
        outline.setNovel(novel);
        outline.setContent("");
        outlineRepository.save(outline);

        return toDTO(novel);
    }

    public NovelDTO update(Long id, NovelDTO dto) {
        Novel novel = novelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
        applyDTO(novel, dto);
        novel = novelRepository.save(novel);
        return toDTO(novel);
    }

    public void delete(Long id) {
        if (!novelRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found");
        }
        novelRepository.deleteById(id);
    }

    private NovelDTO toDTO(Novel novel) {
        NovelDTO dto = new NovelDTO();
        dto.setId(novel.getId());
        dto.setTitle(novel.getTitle());
        dto.setDescription(novel.getDescription());
        dto.setStatus(novel.getStatus());
        dto.setChapterCount((int) chapterRepository.countByNovelId(novel.getId()));
        dto.setCharacterCount((int) characterRepository.countByNovelId(novel.getId()));
        dto.setItemCount((int) itemRepository.countByNovelId(novel.getId()));
        dto.setWorldBuildingCount((int) worldBuildingRepository.countByNovelId(novel.getId()));
        dto.setCreatedAt(novel.getCreatedAt());
        dto.setUpdatedAt(novel.getUpdatedAt());
        return dto;
    }

    private void applyDTO(Novel novel, NovelDTO dto) {
        if (dto.getTitle() != null) novel.setTitle(dto.getTitle());
        if (dto.getDescription() != null) novel.setDescription(dto.getDescription());
        if (dto.getStatus() != null) novel.setStatus(dto.getStatus());
    }
}
