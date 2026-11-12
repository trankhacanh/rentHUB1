package com.renthub.notification.event;

import com.renthub.notification.dto.NotificationRealtimeResponse;

public record NotificationCreatedEvent(
        NotificationRealtimeResponse notification
) {
}
