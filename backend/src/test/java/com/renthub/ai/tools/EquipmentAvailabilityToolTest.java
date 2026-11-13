package com.renthub.ai.tools;

import com.renthub.ai.dto.AiEquipmentAvailabilityResult;
import com.renthub.booking.service.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentAvailabilityToolTest {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private EquipmentAvailabilityTool tool;

    private static final UUID EQUIPMENT_ID =
            UUID.fromString("10000000-0000-0000-0000-000000000002");
    private static final LocalDate START_DATE = LocalDate.of(2026, 12, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 12, 4);

    @Test
    void shouldReturnAvailableWhenBookingServiceConfirmsAvailability() {
        when(bookingService.checkAvailability(EQUIPMENT_ID, START_DATE, END_DATE))
                .thenReturn(true);

        AiEquipmentAvailabilityResult result = tool.checkEquipmentAvailability(
                EQUIPMENT_ID.toString(),
                START_DATE.toString(),
                END_DATE.toString()
        );

        assertEquals("SUCCESS", result.status());
        assertEquals(EQUIPMENT_ID, result.equipmentId());
        assertEquals(Boolean.TRUE, result.available());
        verify(bookingService).checkAvailability(EQUIPMENT_ID, START_DATE, END_DATE);
    }

    @Test
    void shouldReturnUnavailableWhenBookingServiceReturnsFalse() {
        when(bookingService.checkAvailability(EQUIPMENT_ID, START_DATE, END_DATE))
                .thenReturn(false);

        AiEquipmentAvailabilityResult result = tool.checkEquipmentAvailability(
                EQUIPMENT_ID.toString(),
                START_DATE.toString(),
                END_DATE.toString()
        );

        assertEquals("SUCCESS", result.status());
        assertEquals(Boolean.FALSE, result.available());
        verify(bookingService).checkAvailability(EQUIPMENT_ID, START_DATE, END_DATE);
    }

    @Test
    void shouldNotCallBookingServiceWhenEquipmentIdIsInvalid() {
        AiEquipmentAvailabilityResult result = tool.checkEquipmentAvailability(
                "not-a-uuid",
                START_DATE.toString(),
                END_DATE.toString()
        );

        assertEquals("INVALID_INPUT", result.status());
        assertNull(result.available());
        verifyNoInteractions(bookingService);
    }

    @Test
    void shouldNotCallBookingServiceWhenDateIsInvalid() {
        AiEquipmentAvailabilityResult result = tool.checkEquipmentAvailability(
                EQUIPMENT_ID.toString(),
                "01-12-2026",
                END_DATE.toString()
        );

        assertEquals("INVALID_INPUT", result.status());
        assertNull(result.available());
        verifyNoInteractions(bookingService);
    }

    @Test
    void shouldNotClaimAvailabilityWhenBookingServiceRejectsRequest() {
        when(bookingService.checkAvailability(EQUIPMENT_ID, START_DATE, END_DATE))
                .thenThrow(new IllegalArgumentException("Equipment not found"));

        AiEquipmentAvailabilityResult result = tool.checkEquipmentAvailability(
                EQUIPMENT_ID.toString(),
                START_DATE.toString(),
                END_DATE.toString()
        );

        assertEquals("INVALID_REQUEST", result.status());
        assertNull(result.available());
    }
}
