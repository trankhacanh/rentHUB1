package com.renthub.outbox.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.outbox.entity.OutboxEvent;
import com.renthub.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OutboxEventService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public UUID recordEvent(
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Object payload
    ) {
        if (aggregateType == null || aggregateType.isBlank()) {
            throw new IllegalArgumentException("Aggregate type is required");
        }

        if (aggregateId == null) {
            throw new IllegalArgumentException("Aggregate ID is required");
        }

        if (eventType == null || eventType.isBlank()) {
            throw new IllegalArgumentException("Event type is required");
        }

        if (payload == null) {
            throw new IllegalArgumentException("Event payload is required");
        }

        JsonNode payloadNode = objectMapper.valueToTree(payload);

        OutboxEvent event = new OutboxEvent();
        event.setId(UUID.randomUUID());
        event.setAggregateType(aggregateType);
        event.setAggregateId(aggregateId);
        event.setEventType(eventType);
        event.setPayload(payloadNode);
        event.setStatus("PENDING");
        event.setRetryCount(0);
        event.setNextAttemptAt(OffsetDateTime.now(ZoneOffset.UTC));

        outboxEventRepository.save(event);

        return event.getId();
    }
}