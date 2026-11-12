package com.renthub.contract.dto;

import com.renthub.contract.enums.ContractStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class ContractResponse {

    private UUID id;

    private UUID bookingId;

    private UUID renterId;

    private UUID ownerId;

    private String equipmentTitle;

    private LocalDate startDate;
    private Integer currentVersion;
    private LocalDate endDate;

    private Integer totalDays;

    private BigDecimal pricePerDay;

    private BigDecimal rentalAmount;

    private BigDecimal depositAmount;

    private BigDecimal totalAmount;

    private ContractStatus status;

    private ZonedDateTime renterSignedAt;

    private ZonedDateTime ownerSignedAt;

    private String terms;

    private ZonedDateTime createdAt;

    private ZonedDateTime updatedAt;
}