
package com.renthub.outbox.service;

import com.renthub.outbox.entity.OutboxEvent;
import com.renthub.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OutboxClaimService {

    private final OutboxEventRepository outboxEventRepository;

    @Transactional
    public List<OutboxEvent> claimEvents(int batchSize, int leaseSeconds) {
        if (batchSize < 1) {
            throw new IllegalArgumentException(
                    "Batch size must be greater than zero"
            );
        }

        if (leaseSeconds < 1) {
            throw new IllegalArgumentException(
                    "Lease duration must be greater than zero"
            );
        }

        List<OutboxEvent> events =
                outboxEventRepository.findEventsAvailableForClaim(batchSize);

        if (events.isEmpty()) {
            return List.of();
        }

        OffsetDateTime claimedUntil =
                OffsetDateTime.now(ZoneOffset.UTC)
                        .plusSeconds(leaseSeconds);

        for (OutboxEvent event : events) {
            event.setStatus("PROCESSING");
            event.setClaimedUntil(claimedUntil);
        }

        outboxEventRepository.saveAll(events);

        return events;
    }
}
