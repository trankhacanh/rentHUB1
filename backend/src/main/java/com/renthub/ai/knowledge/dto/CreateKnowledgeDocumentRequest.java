package com.renthub.ai.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateKnowledgeDocumentRequest(
        @NotBlank
        @Size(max = 200)
        String title,

        @NotBlank
        @Size(max = 80)
        String category,

        @NotBlank
        @Size(max = 10)
        String language,

        @Size(max = 500)
        String sourceReference,

        LocalDate effectiveFrom,

        LocalDate effectiveUntil,

        @NotBlank
        @Size(max = 100_000)
        String content
) {
}
