package com.renthub.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "processed_message_events")
@Getter
@Setter
@NoArgsConstructor
public class ProcessedMessageEvent {

    @Id
    @Column(name = "event_id", nullable = false, updatable = false)
    private UUID eventId;

    @CreationTimestamp
    @Column(name = "processed_at", nullable = false, updatable = false)
    private OffsetDateTime processedAt;

    public ProcessedMessageEvent(UUID eventId) {
        this.eventId = eventId;
    }
}
