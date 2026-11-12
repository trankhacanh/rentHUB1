package com.renthub.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentResponse {
    private UUID id;
    private String title;
    private String description;
    private BigDecimal pricePerDay;
    private BigDecimal depositAmount;
    private String status;
    private String address;
    private String categoryName;
    private UUID ownerId;
    private String ownerName;
    private String brand;
    private String model;
    private String condition;
    private Integer yearPurchased;
    private String city;
    private String district;
    private String availability;
    private String availableFrom;
    private String availableUntil;
    private String coverImageUrl;
    private List<String> images = new ArrayList<>();
}