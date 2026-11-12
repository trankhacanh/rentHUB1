package com.renthub.review.repository;

import com.renthub.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Optional<Review> findByBookingId(UUID bookingId);

    List<Review> findByEquipmentIdOrderByCreatedAtDesc(
            UUID equipmentId
    );

    List<Review> findByReviewerIdOrderByCreatedAtDesc(
            UUID reviewerId
    );

    boolean existsByBookingId(UUID bookingId);
}