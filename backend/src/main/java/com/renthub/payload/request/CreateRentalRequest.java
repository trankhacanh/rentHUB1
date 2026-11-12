package com.renthub.payload.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class CreateRentalRequest {
    private UUID equipmentId;
    private LocalDate startDate;
    private LocalDate endDate;
}