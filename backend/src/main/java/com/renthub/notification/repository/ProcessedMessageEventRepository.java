
package com.renthub.notification.repository;

import com.renthub.notification.entity.ProcessedMessageEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ProcessedMessageEventRepository
        extends JpaRepository<ProcessedMessageEvent, UUID> {

    @Modifying
    @Query(value = """
            INSERT INTO processed_message_events (event_id)
            VALUES (:eventId)
            ON CONFLICT (event_id) DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(@Param("eventId") UUID eventId);
}
