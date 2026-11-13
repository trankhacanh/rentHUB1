package com.renthub.ai.knowledge.dto;

import com.renthub.ai.knowledge.entity.AiKnowledgeDocument;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AiKnowledgeDocumentResponse(
        UUID id,
        String title,
        String category,
        String language,
        String sourceReference,
        String status,
        Integer version,
        LocalDate effectiveFrom,
        LocalDate effectiveUntil,
        String createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime publishedAt
) {
    public static AiKnowledgeDocumentResponse from(AiKnowledgeDocument document) {
        return new AiKnowledgeDocumentResponse(
                document.getId(),
                document.getTitle(),
                document.getCategory(),
                document.getLanguage(),
                document.getSourceReference(),
                document.getStatus(),
                document.getVersion(),
                document.getEffectiveFrom(),
                document.getEffectiveUntil(),
                document.getCreatedBy(),
                document.getCreatedAt(),
                document.getUpdatedAt(),
                document.getPublishedAt()
        );
    }
}
