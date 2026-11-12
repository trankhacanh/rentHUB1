package com.renthub.payment.repository;

import com.renthub.payment.entity.Payment;
import com.renthub.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByBookingId(UUID bookingId);

    List<Payment> findByPayerIdOrderByCreatedAtDesc(UUID payerId);

    @EntityGraph(attributePaths = {"booking", "payer"})
    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findByStatusOrderByCreatedAtDesc(PaymentStatus status);

    boolean existsByBookingId(UUID bookingId);
}