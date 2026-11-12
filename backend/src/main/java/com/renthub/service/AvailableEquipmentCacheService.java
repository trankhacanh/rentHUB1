package com.renthub.service;

import com.renthub.equipment.repository.EquipmentRepository;
import com.renthub.payload.response.EquipmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AvailableEquipmentCacheService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentResponseMapper equipmentResponseMapper;

    @Cacheable(
            cacheNames = "availableEquipments",
            key = "'all'"
    )
    public List<EquipmentResponse> getAllAvailableEquipments() {
        return equipmentRepository.findByStatus("AVAILABLE")
                .stream()
                .map(equipmentResponseMapper::mapToResponse)
                .toList();
    }
}