package com.renthub.contract.dto;

import com.renthub.contract.enums.ContractStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

public record ContractVersionResponse(
        UUID id,
        UUID contractId,
        Integer versionNumber,
        UUID createdById,

        String equipmentTitle,

        LocalDate startDate,
        LocalDate endDate,
        Integer totalDays,

        BigDecimal pricePerDay,
        BigDecimal rentalAmount,
        BigDecimal depositAmount,
        BigDecimal totalAmount,

        String terms,

        ZonedDateTime renterReviewedAt,
        ZonedDateTime renterSignedAt,
        ZonedDateTime ownerSignedAt,
        ZonedDateTime createdAt,

        Integer currentVersion,
        boolean current,
        ContractStatus contractStatus
) {
}