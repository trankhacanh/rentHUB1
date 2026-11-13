package com.renthub.ai.tools;

import com.renthub.ai.dto.AiRentalQuoteResult;
import com.renthub.booking.dto.RentalQuotePreview;
import com.renthub.booking.service.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RentalQuoteToolTest {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private RentalQuoteTool rentalQuoteTool;

    @Test
    void shouldReturnQuoteFromBookingService() {
        UUID equipmentId = UUID.randomUUID();
        LocalDate start = LocalDate.of(2026, 12, 1);
        LocalDate end = LocalDate.of(2026, 12, 4);

        when(bookingService.previewQuote(equipmentId, start, end)).thenReturn(
                new RentalQuotePreview(
                        equipmentId,
                        "Canon EOS R6",
                        start,
                        end,
                        3,
                        new BigDecimal("450000.00"),
                        new BigDecimal("1350000.00"),
                        BigDecimal.ZERO,
                        new BigDecimal("1350000.00"),
                        true
                )
        );

        AiRentalQuoteResult result = rentalQuoteTool.calculateRentalQuote(
                equipmentId.toString(), "2026-12-01", "2026-12-04"
        );

        assertEquals("SUCCESS", result.status());
        assertEquals(3, result.totalDays());
        assertEquals(new BigDecimal("1350000.00"), result.estimatedTotalVnd());
        assertTrue(result.available());
        verify(bookingService).previewQuote(equipmentId, start, end);
    }

    @Test
    void shouldReturnNotAvailableWithoutClaimingBookingSuccess() {
        UUID equipmentId = UUID.randomUUID();
        LocalDate start = LocalDate.of(2026, 12, 1);
        LocalDate end = LocalDate.of(2026, 12, 4);

        when(bookingService.previewQuote(equipmentId, start, end)).thenReturn(
                new RentalQuotePreview(
                        equipmentId, "Canon EOS R6", start, end, 3,
                        new BigDecimal("450000.00"), new BigDecimal("1350000.00"),
                        BigDecimal.ZERO, new BigDecimal("1350000.00"), false
                )
        );

        AiRentalQuoteResult result = rentalQuoteTool.calculateRentalQuote(
                equipmentId.toString(), "2026-12-01", "2026-12-04"
        );

        assertEquals("NOT_AVAILABLE", result.status());
        assertFalse(result.available());
        assertTrue(result.message().contains("không còn trống lịch"));
    }

    @Test
    void shouldRejectInvalidDateWithoutCallingBookingService() {
        AiRentalQuoteResult result = rentalQuoteTool.calculateRentalQuote(
                UUID.randomUUID().toString(), "01/12/2026", "04/12/2026"
        );

        assertEquals("INVALID_REQUEST", result.status());
        assertNull(result.estimatedTotalVnd());
        verify(bookingService, never()).previewQuote(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void shouldRejectInvalidEquipmentId() {
        AiRentalQuoteResult result = rentalQuoteTool.calculateRentalQuote(
                "not-a-uuid", "2026-12-01", "2026-12-04"
        );

        assertEquals("INVALID_REQUEST", result.status());
        verify(bookingService, never()).previewQuote(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }
}
