package com.renthub.ai.dto;

import java.time.Instant;
import java.util.UUID;

public record AiConversationSummaryResponse(
        UUID conversationId,
        String title,
        String lastMessagePreview,
        Instant updatedAt
) {
}