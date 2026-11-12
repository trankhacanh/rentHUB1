package com.renthub.contract.dto;

import com.renthub.contract.enums.ContractRevisionStatus;

import java.time.ZonedDateTime;
import java.util.UUID;

public record ContractRevisionRequestResponse(
        UUID id,
        UUID contractId,
        UUID contractVersionId,
        UUID requestedById,
        String reason,
        ContractRevisionStatus status,
        ZonedDateTime createdAt
) {
}