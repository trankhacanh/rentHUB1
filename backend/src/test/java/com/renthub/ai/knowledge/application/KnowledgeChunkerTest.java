package com.renthub.ai.knowledge.application;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KnowledgeChunkerTest {

    private final KnowledgeChunker chunker = new KnowledgeChunker();

    @Test
    void returnsNoChunksForBlankContent() {
        assertTrue(chunker.split("  \n  ").isEmpty());
    }

    @Test
    void keepsShortDocumentAsOneChunk() {
        List<String> chunks = chunker.split("# Chính sách\n\nNội dung chính sách.");
        assertEquals(1, chunks.size());
        assertTrue(chunks.getFirst().contains("Nội dung chính sách"));
    }

    @Test
    void splitsLongTextWithinConfiguredMaximum() {
        String source = "đoạn văn ".repeat(500);
        List<String> chunks = chunker.split(source);

        assertTrue(chunks.size() > 1);
        assertFalse(chunks.stream().anyMatch(String::isBlank));
        assertTrue(chunks.stream().allMatch(chunk -> chunk.length() <= KnowledgeChunker.MAX_CHARS));
    }
}
