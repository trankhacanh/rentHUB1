package com.renthub.ai.dto;

import java.time.Instant;
import java.util.UUID;

public record AiConversationMessageResponse(
        UUID messageId,
        String role,
        String content,
        Instant createdAt
) {
}