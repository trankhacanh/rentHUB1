package com.renthub.notification.dto;

import java.util.UUID;

public record BookingNotificationEvent(
        UUID recipientId,
        String type,
        String title,
        String message,
        UUID referenceId,
        String referenceType
) {
}