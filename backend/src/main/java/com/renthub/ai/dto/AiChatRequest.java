package com.renthub.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AiChatRequest(

        @NotBlank(message = "Message is required.")
        @Size(max = 2000, message = "Message must not exceed 2000 characters.")
        String message,

        UUID conversationId

) {
    // Giữ tương thích với code cũ sử dụng new AiChatRequest(message).
    public AiChatRequest(String message) {
        this(message, null);
    }
}