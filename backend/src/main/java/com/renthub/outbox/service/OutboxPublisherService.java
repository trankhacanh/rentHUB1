
package com.renthub.outbox.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.config.RabbitMQConfig;
import com.renthub.outbox.entity.OutboxEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherService {

    private static final int BATCH_SIZE = 50;
    private static final int LEASE_SECONDS = 60;
    private static final int CONFIRM_TIMEOUT_SECONDS = 10;

    private final OutboxClaimService outboxClaimService;
    private final OutboxPublishingStateService publishingStateService;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${renthub.outbox.publisher.enabled:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${renthub.outbox.publisher.delay-ms:1000}")
    public void publishPendingEvents() {
        if (!enabled) {
            return;
        }

        List<OutboxEvent> events =
                outboxClaimService.claimEvents(BATCH_SIZE, LEASE_SECONDS);

        for (OutboxEvent event : events) {
            publishOne(event);
        }
    }

    private void publishOne(OutboxEvent event) {
        try {
            Message message = new Message(
                    objectMapper.writeValueAsBytes(event.getPayload())
            );

            message.getMessageProperties().setContentType("application/json");
            message.getMessageProperties().setMessageId(event.getId().toString());
            message.getMessageProperties().setHeader("eventType", event.getEventType());
            message.getMessageProperties().setHeader(
                    "aggregateType",
                    event.getAggregateType()
            );
            message.getMessageProperties().setHeader(
                    "aggregateId",
                    event.getAggregateId().toString()
            );

            CorrelationData correlationData =
                    new CorrelationData(event.getId().toString());

           String exchange;
String routingKey;

if ("CONTRACT_SIGNED".equals(event.getEventType())) {
    exchange = RabbitMQConfig.CONTRACT_EXCHANGE;
    routingKey = RabbitMQConfig.CONTRACT_PDF_ROUTING_KEY;
} else {
    exchange = RabbitMQConfig.BOOKING_EXCHANGE;
    routingKey = RabbitMQConfig.BOOKING_ROUTING_KEY;
}

rabbitTemplate.send(
        exchange,
        routingKey,
        message,
        correlationData
);

            CorrelationData.Confirm confirm = correlationData.getFuture()
                    .get(CONFIRM_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!confirm.isAck()) {
                throw new IllegalStateException(
                        "RabbitMQ negatively acknowledged event: "
                                + confirm.getReason()
                );
            }

            if (correlationData.getReturned() != null) {
    throw new IllegalStateException(
            "RabbitMQ returned an unroutable message"
    );
}

            publishingStateService.markPublished(event.getId());

            log.debug("Published outbox event {}", event.getId());
        } catch (Exception exception) {
            publishingStateService.scheduleRetry(
                    event.getId(),
                    event.getRetryCount(),
                    exception
            );
        }
    }
}
