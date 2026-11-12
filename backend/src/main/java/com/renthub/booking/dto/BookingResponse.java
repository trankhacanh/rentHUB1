
package com.renthub.booking.dto;

import com.renthub.booking.enums.BookingStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class BookingResponse {

    private UUID id;

    private UUID equipmentId;

    private String equipmentTitle;

    // URL ảnh đại diện của thiết bị
    private String equipmentImageUrl;

    private UUID renterId;

    private String renterName;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer totalDays;

    private BigDecimal pricePerDay;

    private BigDecimal totalAmount;

    private BigDecimal depositAmount;

    private BookingStatus status;

    private String renterNote;

    private String rejectionReason;

    private ZonedDateTime createdAt;

    private ZonedDateTime updatedAt;
}
