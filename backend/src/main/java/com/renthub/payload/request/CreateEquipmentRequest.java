package com.renthub.payload.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class CreateEquipmentRequest {
    private String title;
    private String description;
    private BigDecimal pricePerDay;
    private BigDecimal depositAmount;
    private String address;
    private UUID categoryId;
}