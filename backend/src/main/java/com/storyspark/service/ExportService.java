package com.storyspark.service;

import com.storyspark.model.dto.ChapterDTO;
import com.storyspark.model.entity.Chapter;
import com.storyspark.model.entity.Novel;
import com.storyspark.repository.ChapterRepository;
import com.storyspark.repository.NovelRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);
    private final ChapterRepository chapterRepository;
    private final NovelRepository novelRepository;
    private final ChapterService chapterService;

    public ExportService(ChapterRepository chapterRepository, NovelRepository novelRepository, ChapterService chapterService) {
        this.chapterRepository = chapterRepository;
        this.novelRepository = novelRepository;
        this.chapterService = chapterService;
    }

    // ── Markdown ──────────────────────────────────────────────

    public String exportMarkdown(Long novelId, Long chapterId) {
        ChapterDTO ch = chapterService.findById(novelId, chapterId);
        return "# Chapter " + ch.getChapterNumber() + ": " + ch.getTitle() + "\n\n"
                + (ch.getContent() != null ? ch.getContent() : "");
    }

    public String exportMarkdownAll(Long novelId) {
        Novel novel = getNovel(novelId);
        List<ChapterDTO> chapters = chapterService.findByNovelIdWithContent(novelId);
        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(novel.getTitle()).append("\n\n");
        for (int i = 0; i < chapters.size(); i++) {
            ChapterDTO ch = chapters.get(i);
            sb.append("## Chapter ").append(ch.getChapterNumber()).append(": ").append(ch.getTitle()).append("\n\n");
            if (ch.getContent() != null) sb.append(ch.getContent());
            if (i < chapters.size() - 1) sb.append("\n\n---\n\n");
        }
        return sb.toString();
    }

    // ── TXT (strip Markdown) ──────────────────────────────────

    public String exportTxt(Long novelId, Long chapterId) {
        return stripMarkdown(exportMarkdown(novelId, chapterId));
    }

    public String exportTxtAll(Long novelId) {
        return stripMarkdown(exportMarkdownAll(novelId));
    }

    private String stripMarkdown(String md) {
        return md
            .replaceAll("(?m)^#{1,6}\\s+", "")           // heading prefixes
            .replaceAll("\\*\\*(.+?)\\*\\*", "$1")        // bold
            .replaceAll("\\*(.+?)\\*", "$1")              // italic
            .replaceAll("_{2}(.+?)_{2}", "$1")            // bold alt
            .replaceAll("_(.+?)_", "$1")                  // italic alt
            .replaceAll("~~(.+?)~~", "$1")                // strikethrough
            .replaceAll("\\[([^\\]]+)\\]\\([^)]+\\)", "$1") // links
            .replaceAll("!\\[[^\\]]*\\]\\([^)]+\\)", "")   // images
            .replaceAll("(?m)^```[\\s\\S]*?```", "")       // fenced code blocks
            .replaceAll("`([^`]+)`", "$1")                 // inline code
            .replaceAll("(?m)^---+$", "")                  // horizontal rules
            .replaceAll("\n{3,}", "\n\n")                  // collapse blank lines
            .trim();
    }

    // ── PDF ───────────────────────────────────────────────────

    public byte[] exportPdf(Long novelId, Long chapterId) {
        Novel novel = getNovel(novelId);
        ChapterDTO ch = chapterService.findById(novelId, chapterId);
        return generatePdf(novel.getTitle(), List.of(ch));
    }

    public byte[] exportPdfAll(Long novelId) {
        Novel novel = getNovel(novelId);
        List<ChapterDTO> chapters = chapterService.findByNovelIdWithContent(novelId);
        if (chapters.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No chapters");
        return generatePdf(novel.getTitle(), chapters);
    }

    private byte[] generatePdf(String novelTitle, List<ChapterDTO> chapters) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            BaseFont cjkFont = loadCjkFont();
            Font titleFont = new Font(cjkFont, 18, Font.BOLD);
            Font headingFont = new Font(cjkFont, 14, Font.BOLD);
            Font bodyFont = new Font(cjkFont, 11, Font.NORMAL);

            // Title page
            Paragraph titlePara = new Paragraph(novelTitle, titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(30);
            doc.add(titlePara);

            for (int i = 0; i < chapters.size(); i++) {
                ChapterDTO ch = chapters.get(i);
                if (i > 0) doc.newPage();

                Paragraph chTitle = new Paragraph(
                        "Chapter " + ch.getChapterNumber() + ": " + ch.getTitle(), headingFont);
                chTitle.setSpacingAfter(12);
                doc.add(chTitle);

                if (ch.getContent() != null) {
                    for (String line : ch.getContent().split("\n")) {
                        String cleaned = stripMarkdown(line.trim());
                        if (cleaned.isEmpty()) {
                            doc.add(new Paragraph(" ", bodyFont));
                        } else {
                            doc.add(new Paragraph(cleaned, bodyFont));
                        }
                    }
                }
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("PDF generation failed", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF generation failed: " + e.getMessage());
        }
    }

    private BaseFont loadCjkFont() {
        String[] candidates = {
            "C:/Windows/Fonts/simsun.ttc,0",       // Windows SimSun
            "C:/Windows/Fonts/msyh.ttc,0",         // Windows YaHei
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc,0",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc,0",
            "/System/Library/Fonts/PingFang.ttc,0",
            "/System/Library/Fonts/STHeiti Light.ttc,0",
        };
        for (String candidate : candidates) {
            try {
                return BaseFont.createFont(candidate, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception ignored) { }
        }
        // Fallback: use built-in font (no CJK)
        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.EMBEDDED);
        } catch (Exception e) {
            throw new RuntimeException("Cannot load any PDF font", e);
        }
    }

    // ── Utilities ─────────────────────────────────────────────

    public String sanitizeFilename(String title) {
        return title.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }

    private Novel getNovel(Long novelId) {
        return novelRepository.findById(novelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Novel not found"));
    }
}
