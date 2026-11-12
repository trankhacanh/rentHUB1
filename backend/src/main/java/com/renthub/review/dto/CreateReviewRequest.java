package com.renthub.review.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateReviewRequest {

    private UUID bookingId;

    private Integer rating;

    private String comment;
}