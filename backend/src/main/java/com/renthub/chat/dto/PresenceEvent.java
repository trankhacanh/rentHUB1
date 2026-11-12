package com.renthub.chat.dto;

import java.time.Instant;
import java.util.UUID;

public record PresenceEvent(
        UUID userId,
        PresenceStatus status,
        Instant lastSeenAt
) {
    public enum PresenceStatus {
        ONLINE,
        OFFLINE
    }

    public static PresenceEvent online(UUID userId) {
        return new PresenceEvent(
                userId,
                PresenceStatus.ONLINE,
                null
        );
    }

    public static PresenceEvent offline(
            UUID userId,
            Instant lastSeenAt
    ) {
        return new PresenceEvent(
                userId,
                PresenceStatus.OFFLINE,
                lastSeenAt
        );
    }
}