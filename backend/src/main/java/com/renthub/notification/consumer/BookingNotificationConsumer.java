package com.renthub.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.config.RabbitMQConfig;
import com.renthub.notification.dto.BookingNotificationEvent;
import com.renthub.notification.service.BookingNotificationProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final BookingNotificationProcessor processor;

    @RabbitListener(queues = RabbitMQConfig.BOOKING_QUEUE)
    public void consume(Message message) throws Exception {
        String messageId = message.getMessageProperties().getMessageId();

        if (messageId == null || messageId.isBlank()) {
            throw new IllegalArgumentException(
                    "RabbitMQ message is missing messageId"
            );
        }

        UUID eventId = UUID.fromString(messageId);

        BookingNotificationEvent event = objectMapper.readValue(
                message.getBody(),
                BookingNotificationEvent.class
        );

        boolean processed = processor.process(eventId, event);

        if (processed) {
            log.info("Processed booking notification event {}", eventId);
        } else {
            log.info("Skipped duplicate booking notification event {}", eventId);
        }
    }
}
