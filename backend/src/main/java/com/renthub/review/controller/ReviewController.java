package com.renthub.review.controller;

import com.renthub.review.dto.CreateReviewRequest;
import com.renthub.review.dto.ReviewResponse;
import com.renthub.review.service.ReviewService;
import com.renthub.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;


import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        ReviewResponse response =
                reviewService.createReview(
                        request,
                        userDetails.getId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> getReviewById(
            @PathVariable UUID reviewId
    ) {

        ReviewResponse response =
                reviewService.getReviewById(
                        reviewId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByEquipment(
            @PathVariable UUID equipmentId
    ) {

        List<ReviewResponse> reviews =
                reviewService.getReviewsByEquipment(
                        equipmentId
                );

        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        List<ReviewResponse> reviews =
                reviewService.getMyReviews(
                        userDetails.getId()
                );

        return ResponseEntity.ok(reviews);
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable UUID reviewId,
            @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        ReviewResponse response =
                reviewService.updateReview(
                        reviewId,
                        request,
                        userDetails.getId()
                );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable UUID reviewId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        reviewService.deleteReview(
                reviewId,
                userDetails.getId()
        );

        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/admin/all")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<ReviewResponse>> getAllReviewsForAdmin() {
    return ResponseEntity.ok(
            reviewService.getAllReviewsForAdmin()
    );
}
}