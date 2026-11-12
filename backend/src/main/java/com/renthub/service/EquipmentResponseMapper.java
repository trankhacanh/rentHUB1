package com.renthub.service;

import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.entity.EquipmentImage;
import com.renthub.equipment.repository.EquipmentImageRepository;
import com.renthub.payload.response.EquipmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EquipmentResponseMapper {

    private final EquipmentImageRepository equipmentImageRepository;

    public EquipmentResponse mapToResponse(Equipment equipment) {
        List<String> imageUrls =
                equipmentImageRepository
                        .findByEquipmentIdOrderBySortOrderAsc(equipment.getId())
                        .stream()
                        .map(EquipmentImage::getImageUrl)
                        .toList();

        String coverImageUrl =
                imageUrls.isEmpty() ? null : imageUrls.get(0);

        return new EquipmentResponse(
                equipment.getId(),
                equipment.getTitle(),
                equipment.getDescription(),
                equipment.getPricePerDay(),
                equipment.getDepositAmount(),
                equipment.getStatus(),
                equipment.getAddress(),
                equipment.getCategory() != null
                        ? equipment.getCategory().getName() : null,
                equipment.getOwner() != null
                        ? equipment.getOwner().getId() : null,
                equipment.getOwner() != null
                        ? equipment.getOwner().getFirstName() + " "
                                + equipment.getOwner().getLastName()
                        : null,
                equipment.getBrand(),
                equipment.getModel(),
                equipment.getCondition(),
                equipment.getYearPurchased(),
                equipment.getCity(),
                equipment.getDistrict(),
                equipment.getAvailability(),
                equipment.getAvailableFrom(),
                equipment.getAvailableUntil(),
                coverImageUrl,
                imageUrls
        );
    }
}