package com.renthub.ai.conversation.application;

public record AiChatMessage(
        String role,
        String content
) {
}