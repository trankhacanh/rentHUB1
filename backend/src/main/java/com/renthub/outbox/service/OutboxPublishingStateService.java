
package com.renthub.outbox.service;

import com.renthub.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublishingStateService {

    private static final int MAX_RETRIES = 8;
    private static final long MAX_BACKOFF_SECONDS = 300;

    private final OutboxEventRepository outboxEventRepository;

    @Transactional
    public void markPublished(UUID eventId) {
        int updated = outboxEventRepository.markAsPublished(
                eventId,
                OffsetDateTime.now(ZoneOffset.UTC)
        );

        if (updated != 1) {
            log.warn(
                    "Could not mark outbox event {} as PUBLISHED",
                    eventId
            );
        }
    }

    @Transactional
    public void scheduleRetry(UUID eventId, int currentRetryCount, Exception exception) {
        int nextRetry = currentRetryCount + 1;
        boolean exhausted = nextRetry >= MAX_RETRIES;

        long backoffSeconds = Math.min(
                1L << Math.min(nextRetry, 8),
                MAX_BACKOFF_SECONDS
        );

        String error = exception.getMessage();
        if (error == null || error.isBlank()) {
            error = exception.getClass().getSimpleName();
        }
        if (error.length() > 4000) {
            error = error.substring(0, 4000);
        }

        int updated = outboxEventRepository.scheduleRetry(
                eventId,
                exhausted ? "FAILED" : "PENDING",
                OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(backoffSeconds),
                error
        );

        if (updated != 1) {
            log.warn("Could not schedule retry for outbox event {}", eventId);
            return;
        }

        log.warn(
                "Publishing outbox event {} failed; retry {}/{}; terminal={}",
                eventId,
                nextRetry,
                MAX_RETRIES,
                exhausted,
                exception
        );
    }
}
