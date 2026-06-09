package com.storyspark.controller;

import com.storyspark.model.entity.Novel;
import com.storyspark.repository.NovelRepository;
import com.storyspark.service.ExportService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/novels/{novelId}/export")
public class ExportController {

    private final ExportService exportService;
    private final NovelRepository novelRepository;

    public ExportController(ExportService exportService, NovelRepository novelRepository) {
        this.exportService = exportService;
        this.novelRepository = novelRepository;
    }

    private String novelTitle(Long novelId) {
        return novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"))
                .getTitle();
    }

    private String encode(String filename) {
        return URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
    }

    // ── Markdown ──────────────────────────────────────────────

    @GetMapping("/markdown")
    public ResponseEntity<String> exportMarkdown(
            @PathVariable Long novelId,
            @RequestParam(required = false) Long chapterId) {
        String content;
        String filename;
        String title = exportService.sanitizeFilename(novelTitle(novelId));
        if (chapterId != null) {
            content = exportService.exportMarkdown(novelId, chapterId);
            filename = title + "_chapter" + chapterId + ".md";
        } else {
            content = exportService.exportMarkdownAll(novelId);
            filename = title + ".md";
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "markdown", StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment().filename(encode(filename), StandardCharsets.UTF_8).build());
        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }

    // ── TXT ───────────────────────────────────────────────────

    @GetMapping("/txt")
    public ResponseEntity<String> exportTxt(
            @PathVariable Long novelId,
            @RequestParam(required = false) Long chapterId) {
        String content;
        String filename;
        String title = exportService.sanitizeFilename(novelTitle(novelId));
        if (chapterId != null) {
            content = exportService.exportTxt(novelId, chapterId);
            filename = title + "_chapter" + chapterId + ".txt";
        } else {
            content = exportService.exportTxtAll(novelId);
            filename = title + ".txt";
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "plain", StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment().filename(encode(filename), StandardCharsets.UTF_8).build());
        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }

    // ── PDF ───────────────────────────────────────────────────

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable Long novelId,
            @RequestParam(required = false) Long chapterId) {
        byte[] content;
        String filename;
        String title = exportService.sanitizeFilename(novelTitle(novelId));
        if (chapterId != null) {
            content = exportService.exportPdf(novelId, chapterId);
            filename = title + "_chapter" + chapterId + ".pdf";
        } else {
            content = exportService.exportPdfAll(novelId);
            filename = title + ".pdf";
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(encode(filename), StandardCharsets.UTF_8).build());
        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }
}
