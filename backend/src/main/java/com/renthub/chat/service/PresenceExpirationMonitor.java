package com.renthub.chat.service;

import java.time.Instant;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceExpirationMonitor {

    private static final String USER_SESSIONS_PATTERN =
            "renthub:presence:user:*:sessions";

    private static final String USER_SESSIONS_PREFIX =
            "renthub:presence:user:";

    private static final String USER_SESSIONS_SUFFIX =
            ":sessions";

    private final StringRedisTemplate redisTemplate;
    private final PresenceService presenceService;
    private final PresenceBroadcastService broadcastService;

    @Scheduled(fixedDelay = 30_000)
    public void detectExpiredSessions() {
        ScanOptions options = ScanOptions.scanOptions()
                .match(USER_SESSIONS_PATTERN)
                .count(100)
                .build();

        try (Cursor<String> cursor = redisTemplate.scan(options)) {
            while (cursor.hasNext()) {
                processUserSessionsKey(cursor.next());
            }
        } catch (Exception exception) {
            log.error(
                    "Failed to scan expired presence sessions",
                    exception
            );
        }
    }

    private void processUserSessionsKey(String sessionsKey) {
        String userIdText = sessionsKey.substring(
                USER_SESSIONS_PREFIX.length()
        );

        if (!userIdText.endsWith(USER_SESSIONS_SUFFIX)) {
            return;
        }

        userIdText = userIdText.substring(
                0,
                userIdText.length() - USER_SESSIONS_SUFFIX.length()
        );

        UUID userId;

        try {
            userId = UUID.fromString(userIdText);
        } catch (IllegalArgumentException exception) {
            log.warn(
                    "Ignoring invalid presence key: {}",
                    sessionsKey
            );
            return;
        }

        long transition = presenceService.reconcile(userId);

        if (transition == 1) {
            broadcastService.broadcastOnline(userId);

            log.debug(
                    "User {} reconciled to ONLINE",
                    userId
            );
       } else if (transition == -1) {
    Instant lastSeenAt = presenceService.getLastSeenAt(userId);

    broadcastService.broadcastOffline(
            userId,
            lastSeenAt != null ? lastSeenAt : Instant.now()
    );
            log.debug(
                    "User {} reconciled to OFFLINE after session expiration",
                    userId
            );
        }
    }
}