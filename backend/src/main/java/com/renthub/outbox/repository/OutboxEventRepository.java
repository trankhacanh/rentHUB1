
package com.renthub.outbox.repository;

import com.renthub.outbox.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository
        extends JpaRepository<OutboxEvent, UUID> {

    @Query(value = """
            SELECT *
            FROM outbox_events
            WHERE (
                status = 'PENDING'
                AND next_attempt_at <= CURRENT_TIMESTAMP
            )
            OR (
                status = 'PROCESSING'
                AND claimed_until <= CURRENT_TIMESTAMP
            )
            ORDER BY next_attempt_at, created_at
            LIMIT :batchSize
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<OutboxEvent> findEventsAvailableForClaim(
            @Param("batchSize") int batchSize
    );

    
    @Modifying
    @Query("""
            UPDATE OutboxEvent e
            SET e.status = 'PUBLISHED',
                e.publishedAt = :publishedAt,
                e.claimedUntil = null,
                e.lastError = null
            WHERE e.id = :id
              AND e.status = 'PROCESSING'
            """)
    int markAsPublished(
            @Param("id") UUID id,
            @Param("publishedAt") OffsetDateTime publishedAt
    );

    @Modifying
    @Query("""
            UPDATE OutboxEvent e
            SET e.status = :status,
                e.retryCount = e.retryCount + 1,
                e.nextAttemptAt = :nextAttemptAt,
                e.claimedUntil = null,
                e.lastError = :lastError
            WHERE e.id = :id
              AND e.status = 'PROCESSING'
            """)
    int scheduleRetry(
            @Param("id") UUID id,
            @Param("status") String status,
            @Param("nextAttemptAt") OffsetDateTime nextAttemptAt,
            @Param("lastError") String lastError
    );

}
