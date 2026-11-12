package com.renthub.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class UnavailableDatesResponse {

    private List<LocalDate> dates;
}