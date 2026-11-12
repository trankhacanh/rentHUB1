package com.renthub.equipment.repository;

import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.entity.EquipmentImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EquipmentImageRepository extends JpaRepository<EquipmentImage, UUID> {
    List<EquipmentImage> findByEquipmentOrderBySortOrderAsc(Equipment equipment);
    List<EquipmentImage> findByEquipmentIdOrderBySortOrderAsc(UUID equipmentId);
}
