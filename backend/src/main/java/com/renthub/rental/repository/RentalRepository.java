package com.renthub.rental.repository;

import com.renthub.rental.entity.Rental;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RentalRepository extends JpaRepository<Rental, UUID> {
    List<Rental> findByRenterId(UUID renterId);
    List<Rental> findByEquipmentOwnerId(UUID ownerId);
}