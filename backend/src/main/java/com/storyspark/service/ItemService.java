package com.storyspark.service;

import com.storyspark.model.entity.Item;
import com.storyspark.model.entity.Novel;
import com.storyspark.repository.ItemRepository;
import com.storyspark.repository.NovelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class ItemService {

    private final ItemRepository itemRepository;
    private final NovelRepository novelRepository;

    public ItemService(ItemRepository itemRepository, NovelRepository novelRepository) {
        this.itemRepository = itemRepository;
        this.novelRepository = novelRepository;
    }

    @Transactional(readOnly = true)
    public List<Item> findByNovelId(Long novelId) {
        return itemRepository.findByNovelId(novelId);
    }

    @Transactional(readOnly = true)
    public Item findById(Long novelId, Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!item.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found in this novel");
        }
        return item;
    }

    public Item create(Long novelId, Item entity) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
        entity.setId(null);
        entity.setNovel(novel);
        return itemRepository.save(entity);
    }

    public Item update(Long novelId, Long id, Item entity) {
        Item existing = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!existing.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found in this novel");
        }
        existing.setName(entity.getName());
        existing.setDescription(entity.getDescription());
        existing.setSignificance(entity.getSignificance());
        existing.setType(entity.getType());
        return itemRepository.save(existing);
    }

    public void delete(Long novelId, Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!item.getNovel().getId().equals(novelId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found in this novel");
        }
        itemRepository.delete(item);
    }
}
