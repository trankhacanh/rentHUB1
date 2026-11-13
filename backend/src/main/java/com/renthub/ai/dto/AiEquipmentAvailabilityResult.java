package com.renthub.ai.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Read-only result returned to the AI model after checking RentHub's
 * existing booking rules. A null `available` means the check could not
 * be completed; it must not be interpreted as available or unavailable.
 */
public record AiEquipmentAvailabilityResult(
        String status,
        UUID equipmentId,
        LocalDate startDate,
        LocalDate endDate,
        Boolean available,
        String message
) {
}
