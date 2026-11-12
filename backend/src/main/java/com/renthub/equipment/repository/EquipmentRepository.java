
package com.renthub.equipment.repository;

import com.renthub.equipment.entity.Equipment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EquipmentRepository extends JpaRepository<Equipment, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Equipment e WHERE e.id = :id")
    Optional<Equipment> findByIdForUpdate(@Param("id") UUID id);

    List<Equipment> findByStatus(String status);

    List<Equipment> findByOwnerId(UUID ownerId);

    // Tìm thiết bị theo trạng thái + địa chỉ
    List<Equipment> findByStatusAndAddressContaining(
            String status,
            String address
    );

    // Tìm thiết bị theo trạng thái + địa chỉ + category
    List<Equipment> findByStatusAndAddressContainingAndCategoryId(
            String status,
            String address,
            UUID categoryId
    );
}
