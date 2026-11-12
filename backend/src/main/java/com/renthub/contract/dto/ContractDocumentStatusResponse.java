package com.renthub.contract.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ContractDocumentStatusResponse(
        UUID contractId,
        UUID contractVersionId,
        Integer versionNumber,
        String status,
        String fileName,
        String contentType,
        Long fileSize,
        OffsetDateTime generatedAt
) {
}