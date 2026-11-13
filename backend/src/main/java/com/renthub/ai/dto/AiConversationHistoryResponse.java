package com.renthub.ai.dto;

import java.util.List;
import java.util.UUID;

public record AiConversationHistoryResponse(
        UUID conversationId,
        List<AiConversationMessageResponse> messages
) {
    public AiConversationHistoryResponse {
        messages = List.copyOf(messages);
    }
}