package com.renthub.review.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class ReviewResponse {

    private UUID id;

    private UUID bookingId;

    private UUID equipmentId;

    private String equipmentTitle;

    private UUID reviewerId;

    private String reviewerName;

    private Integer rating;

    private String comment;

    private ZonedDateTime createdAt;

    private ZonedDateTime updatedAt;
}