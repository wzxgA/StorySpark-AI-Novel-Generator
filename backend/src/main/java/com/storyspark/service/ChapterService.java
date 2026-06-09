package com.storyspark.service;

import com.storyspark.model.dto.ChapterDTO;
import com.storyspark.model.entity.Chapter;
import com.storyspark.model.entity.Novel;
import com.storyspark.repository.ChapterRepository;
import com.storyspark.repository.NovelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final NovelRepository novelRepository;

    public ChapterService(ChapterRepository chapterRepository, NovelRepository novelRepository) {
        this.chapterRepository = chapterRepository;
        this.novelRepository = novelRepository;
    }

    @Transactional(readOnly = true)
    public List<ChapterDTO> findByNovelId(Long novelId) {
        return chapterRepository.findByNovelIdOrderByChapterNumberAsc(novelId).stream()
                .map(this::toDTOSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChapterDTO findById(Long novelId, Long id) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        if (!chapter.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found in this novel");
        }
        return toDTO(chapter);
    }

    public ChapterDTO create(Long novelId, ChapterDTO dto) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));

        // Auto-assign chapter number if not specified
        if (dto.getChapterNumber() <= 0) {
            long count = chapterRepository.countByNovelId(novelId);
            dto.setChapterNumber((int) count + 1);
        }

        Chapter chapter = new Chapter();
        chapter.setNovel(novel);
        applyDTO(chapter, dto);
        chapter = chapterRepository.save(chapter);
        return toDTO(chapter);
    }

    public ChapterDTO update(Long novelId, Long id, ChapterDTO dto) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        if (!chapter.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found in this novel");
        }
        applyDTO(chapter, dto);
        chapter = chapterRepository.save(chapter);
        return toDTO(chapter);
    }

    public void delete(Long novelId, Long id) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));
        if (!chapter.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found in this novel");
        }
        chapterRepository.delete(chapter);
    }

    private ChapterDTO toDTOSummary(Chapter chapter) {
        ChapterDTO dto = toDTO(chapter);
        dto.setContent(null);
        return dto;
    }

    private ChapterDTO toDTO(Chapter chapter) {
        ChapterDTO dto = new ChapterDTO();
        dto.setId(chapter.getId());
        dto.setNovelId(chapter.getNovel().getId());
        dto.setChapterNumber(chapter.getChapterNumber());
        dto.setTitle(chapter.getTitle());
        dto.setContent(chapter.getContent());
        dto.setWordCount(chapter.getWordCount());
        dto.setStatus(chapter.getStatus());
        dto.setCreatedAt(chapter.getCreatedAt());
        dto.setUpdatedAt(chapter.getUpdatedAt());
        return dto;
    }

    private void applyDTO(Chapter chapter, ChapterDTO dto) {
        if (dto.getTitle() != null) chapter.setTitle(dto.getTitle());
        if (dto.getContent() != null) {
            chapter.setContent(dto.getContent());
            chapter.setWordCount(dto.getContent().split("\\s+").length);
        }
        if (dto.getChapterNumber() > 0) chapter.setChapterNumber(dto.getChapterNumber());
        if (dto.getStatus() != null) chapter.setStatus(dto.getStatus());
    }
}
