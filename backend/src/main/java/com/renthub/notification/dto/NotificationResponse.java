package com.renthub.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class NotificationResponse {

    private UUID id;

    private UUID userId;

    private String type;

    private String title;

    private String message;

    private Boolean read;

    private UUID referenceId;

    private String referenceType;

    private ZonedDateTime createdAt;
}