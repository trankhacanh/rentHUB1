package com.renthub.ai.dto;

import java.time.Instant;
import java.util.UUID;

public record AiChatResponse(
        String answer,
        Instant createdAt,
        UUID conversationId
) {
    // Giữ tương thích với code cũ.
    public AiChatResponse(String answer, Instant createdAt) {
        this(answer, createdAt, null);
    }
}