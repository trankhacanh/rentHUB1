package com.renthub.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Read-only rental price preview.
 * This DTO does not create, update, or reserve a booking.
 */
public record RentalQuotePreview(
                UUID equipmentId,
                String equipmentTitle,
                LocalDate startDate,
                LocalDate endDate,
                int totalDays,
                BigDecimal pricePerDay,
                BigDecimal rentalAmount,
                BigDecimal depositAmount,
                BigDecimal estimatedTotal,
                boolean available) {
}
