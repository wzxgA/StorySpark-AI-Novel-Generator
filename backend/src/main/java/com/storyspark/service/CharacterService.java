package com.storyspark.service;

import com.storyspark.model.entity.Character;
import com.storyspark.model.entity.Novel;
import com.storyspark.repository.CharacterRepository;
import com.storyspark.repository.NovelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final NovelRepository novelRepository;

    public CharacterService(CharacterRepository characterRepository, NovelRepository novelRepository) {
        this.characterRepository = characterRepository;
        this.novelRepository = novelRepository;
    }

    @Transactional(readOnly = true)
    public List<Character> findByNovelId(Long novelId) {
        return characterRepository.findByNovelId(novelId);
    }

    @Transactional(readOnly = true)
    public Character findById(Long novelId, Long id) {
        Character character = characterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Character not found"));
        if (!character.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Character not found in this novel");
        }
        return character;
    }

    public Character create(Long novelId, Character entity) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
        entity.setId(null);
        entity.setNovel(novel);
        return characterRepository.save(entity);
    }

    public Character update(Long novelId, Long id, Character entity) {
        Character existing = characterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Character not found"));
        if (!existing.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Character not found in this novel");
        }
        existing.setName(entity.getName());
        existing.setDescription(entity.getDescription());
        existing.setTraits(entity.getTraits());
        existing.setRelationships(entity.getRelationships());
        return characterRepository.save(existing);
    }

    public void delete(Long novelId, Long id) {
        Character character = characterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Character not found"));
        if (!character.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Character not found in this novel");
        }
        characterRepository.delete(character);
    }
}
