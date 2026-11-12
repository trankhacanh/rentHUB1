package com.renthub.contract.repository;

import com.renthub.contract.entity.Contract;
import com.renthub.contract.enums.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {
    
    Optional<Contract> findByBookingId(UUID bookingId);

    List<Contract> findByRenterIdOrderByCreatedAtDesc(UUID renterId);

    List<Contract> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Contract> findByStatusOrderByCreatedAtDesc(
            ContractStatus status
    );

    boolean existsByBookingId(UUID bookingId);
}