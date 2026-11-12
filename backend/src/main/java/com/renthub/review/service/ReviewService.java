package com.renthub.review.service;

import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.booking.repository.BookingRepository;
import com.renthub.equipment.entity.Equipment;
import com.renthub.review.dto.CreateReviewRequest;
import com.renthub.review.dto.ReviewResponse;
import com.renthub.review.entity.Review;
import com.renthub.review.repository.ReviewRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse createReview(
            CreateReviewRequest request,
            UUID reviewerId
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Review request is required"
            );
        }

        if (request.getBookingId() == null) {
            throw new IllegalArgumentException(
                    "Booking ID is required"
            );
        }

        if (request.getRating() == null) {
            throw new IllegalArgumentException(
                    "Rating is required"
            );
        }

        if (request.getRating() < 1
                || request.getRating() > 5) {

            throw new IllegalArgumentException(
                    "Rating must be between 1 and 5"
            );
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Reviewer not found"
                        )
                );

        Booking booking = bookingRepository.findById(
                request.getBookingId()
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "Booking not found"
                )
        );

        if (!booking.getRenter().getId().equals(reviewerId)) {
            throw new IllegalArgumentException(
                    "You are not the renter of this booking"
            );
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Only COMPLETED bookings can be reviewed"
            );
        }

        if (reviewRepository.existsByBookingId(
                booking.getId()
        )) {
            throw new IllegalArgumentException(
                    "This booking has already been reviewed"
            );
        }

        Equipment equipment = booking.getEquipment();

        if (equipment.getOwner().getId().equals(reviewerId)) {
            throw new IllegalArgumentException(
                    "You cannot review your own equipment"
            );
        }

        Review review = new Review();

        review.setBooking(booking);

        review.setEquipment(equipment);

        review.setReviewer(reviewer);

        review.setRating(
                request.getRating()
        );

        review.setComment(
                request.getComment()
        );

        Review savedReview =
                reviewRepository.saveAndFlush(review);

        return toResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(
            UUID reviewId
    ) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Review not found"
                        )
                );

        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByEquipment(
            UUID equipmentId
    ) {

        return reviewRepository
                .findByEquipmentIdOrderByCreatedAtDesc(
                        equipmentId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(
            UUID reviewerId
    ) {

        return reviewRepository
                .findByReviewerIdOrderByCreatedAtDesc(
                        reviewerId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse updateReview(
            UUID reviewId,
            CreateReviewRequest request,
            UUID reviewerId
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Review request is required"
            );
        }

        if (request.getRating() == null) {
            throw new IllegalArgumentException(
                    "Rating is required"
            );
        }

        if (request.getRating() < 1
                || request.getRating() > 5) {

            throw new IllegalArgumentException(
                    "Rating must be between 1 and 5"
            );
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Review not found"
                        )
                );

        if (!review.getReviewer().getId().equals(reviewerId)) {
            throw new IllegalArgumentException(
                    "You are not the reviewer of this review"
            );
        }

        review.setRating(
                request.getRating()
        );

        review.setComment(
                request.getComment()
        );

        Review savedReview =
                reviewRepository.saveAndFlush(review);

        return toResponse(savedReview);
    }
        @Transactional(readOnly = true)
public List<ReviewResponse> getAllReviewsForAdmin() {
    return reviewRepository
            .findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
            .stream()
            .map(this::toResponse)
            .toList();
}

    @Transactional
    public void deleteReview(
            UUID reviewId,
            UUID reviewerId
    ) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Review not found"
                        )
                );

        if (!review.getReviewer().getId().equals(reviewerId)) {
            throw new IllegalArgumentException(
                    "You are not the reviewer of this review"
            );
        }

        reviewRepository.delete(review);
    }

    private ReviewResponse toResponse(
            Review review
    ) {

        ReviewResponse response =
                new ReviewResponse();

        response.setId(
                review.getId()
        );

        response.setBookingId(
                review.getBooking().getId()
        );

        response.setEquipmentId(
                review.getEquipment().getId()
        );

        response.setEquipmentTitle(
                review.getEquipment().getTitle()
        );

        response.setReviewerId(
                review.getReviewer().getId()
        );

        String firstName =
                review.getReviewer().getFirstName();

        String lastName =
                review.getReviewer().getLastName();

        String reviewerName =
                ((firstName != null ? firstName : "")
                        + " "
                        + (lastName != null ? lastName : ""))
                        .trim();

        response.setReviewerName(
                reviewerName
        );

        response.setRating(
                review.getRating()
        );

        response.setComment(
                review.getComment()
        );

        response.setCreatedAt(
                review.getCreatedAt()
        );

        response.setUpdatedAt(
                review.getUpdatedAt()
        );

        return response;
    }
}