package com.renthub.ai.knowledge.application;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Small paragraph-aware chunker. It deliberately avoids an additional tokenizer
 * dependency; chunk size is measured in Java characters, not model tokens.
 */
@Component
public class KnowledgeChunker {

    static final int MAX_CHARS = 1_200;
    static final int OVERLAP_CHARS = 160;

    public List<String> split(String source) {
        if (source == null || source.isBlank()) {
            return List.of();
        }

        String normalized = source
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("[\\t ]+", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();

        List<String> paragraphs = List.of(normalized.split("\\n\\s*\\n"));
        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String paragraphValue : paragraphs) {
            String paragraph = paragraphValue.trim();
            if (paragraph.isEmpty()) {
                continue;
            }

            if (paragraph.length() > MAX_CHARS) {
                flush(current, chunks);
                appendLongParagraph(paragraph, chunks);
                continue;
            }

            int required = current.length() == 0
                    ? paragraph.length()
                    : current.length() + 2 + paragraph.length();

            if (required > MAX_CHARS) {
                flush(current, chunks);
            }

            if (current.length() > 0) {
                current.append("\n\n");
            }
            current.append(paragraph);
        }

        flush(current, chunks);
        return List.copyOf(chunks);
    }

    private void appendLongParagraph(String paragraph, List<String> chunks) {
        int start = 0;
        while (start < paragraph.length()) {
            int end = Math.min(start + MAX_CHARS, paragraph.length());

            if (end < paragraph.length()) {
                int boundary = paragraph.lastIndexOf(' ', end);
                if (boundary > start + (MAX_CHARS / 2)) {
                    end = boundary;
                }
            }

            String chunk = paragraph.substring(start, end).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }

            if (end >= paragraph.length()) {
                break;
            }

            start = Math.max(start + 1, end - OVERLAP_CHARS);
            while (start < paragraph.length() && paragraph.charAt(start) == ' ') {
                start++;
            }
        }
    }

    private void flush(StringBuilder current, List<String> chunks) {
        String value = current.toString().trim();
        if (!value.isEmpty()) {
            chunks.add(value);
        }
        current.setLength(0);
    }
}
