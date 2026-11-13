package com.renthub.ai.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Public, AI-safe projection of an equipment listing.
 * Intentionally excludes owner identity, serial number, and full street address.
 */
public record AiEquipmentSearchItem(
        UUID id,
        String title,
        String categoryName,
        String brand,
        String model,
        String description,
        BigDecimal pricePerDayVnd,
        BigDecimal depositAmountVnd,
        String city,
        String district,
        String condition,
        String listingStatus
) {
}
