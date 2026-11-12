
package com.renthub.contract.generator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Objects;
import java.util.UUID;

public record ContractPdfData(
        UUID contractId,
        UUID contractVersionId,
        Integer versionNumber,

        String equipmentTitle,
        LocalDate startDate,
        LocalDate endDate,
        Integer totalDays,

        BigDecimal pricePerDay,
        BigDecimal rentalAmount,
        BigDecimal depositAmount,
        BigDecimal totalAmount,

        String renterName,
        String renterEmail,

        String ownerName,
        String ownerEmail,

        String terms,

        ZonedDateTime renterSignedAt,
        ZonedDateTime ownerSignedAt
) {
    public ContractPdfData {
        Objects.requireNonNull(contractId, "contractId is required");
        Objects.requireNonNull(contractVersionId, "contractVersionId is required");
        Objects.requireNonNull(versionNumber, "versionNumber is required");
        Objects.requireNonNull(equipmentTitle, "equipmentTitle is required");
        Objects.requireNonNull(startDate, "startDate is required");
        Objects.requireNonNull(endDate, "endDate is required");
        Objects.requireNonNull(totalDays, "totalDays is required");

        Objects.requireNonNull(pricePerDay, "pricePerDay is required");
        Objects.requireNonNull(rentalAmount, "rentalAmount is required");
        Objects.requireNonNull(totalAmount, "totalAmount is required");

        if (versionNumber < 1 || totalDays < 1) {
            throw new IllegalArgumentException("Invalid contract version or rental days");
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Contract start date must not be after end date");
        }

        if (renterSignedAt == null || ownerSignedAt == null) {
            throw new IllegalArgumentException(
                    "Both parties must sign before generating the official PDF"
            );
        }

        if (depositAmount == null) {
            depositAmount = BigDecimal.ZERO;
        }
    }
}
