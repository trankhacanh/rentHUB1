package com.renthub.booking.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class CreateBookingRequest {

    private UUID equipmentId;

    private LocalDate startDate;

    private LocalDate endDate;

    private String renterNote;
}