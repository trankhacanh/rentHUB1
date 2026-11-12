package com.renthub.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class RentalResponse {
    private UUID id;
    private UUID equipmentId;
    private String equipmentTitle;
    private UUID renterId;
    private String renterName;
    private UUID ownerId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private String status;
}