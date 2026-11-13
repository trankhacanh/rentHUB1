package com.renthub.ai.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Safe, typed result exposed to the AI model.
 * All monetary values are expressed in VND.
 */
public record AiRentalQuoteResult(
        String status,
        String message,
        UUID equipmentId,
        String equipmentTitle,
        LocalDate startDate,
        LocalDate endDate,
        int totalDays,
        BigDecimal pricePerDayVnd,
        BigDecimal rentalAmountVnd,
        BigDecimal depositAmountVnd,
        BigDecimal estimatedTotalVnd,
        Boolean available) {
    public static AiRentalQuoteResult invalidRequest(String message) {
        return new AiRentalQuoteResult(
                "INVALID_REQUEST",
                message,
                null,
                null,
                null,
                null,
                0,
                null,
                null,
                null,
                null,
                null);
    }

    public static AiRentalQuoteResult notFound(String message) {
        return new AiRentalQuoteResult(
                "NOT_FOUND",
                message,
                null,
                null,
                null,
                null,
                0,
                null,
                null,
                null,
                null,
                null);
    }

    public static AiRentalQuoteResult error(String message) {
        return new AiRentalQuoteResult(
                "ERROR",
                message,
                null,
                null,
                null,
                null,
                0,
                null,
                null,
                null,
                null,
                null);
    }
}
