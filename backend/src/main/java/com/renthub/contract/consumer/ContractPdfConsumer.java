
package com.renthub.contract.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.config.RabbitMQConfig;
import com.renthub.contract.event.ContractSignedEvent;
import com.renthub.contract.service.ContractPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractPdfConsumer {

    private static final String EXPECTED_EVENT_TYPE = "CONTRACT_SIGNED";

    private final ObjectMapper objectMapper;
    private final ContractPdfService contractPdfService;

    @RabbitListener(queues = RabbitMQConfig.CONTRACT_PDF_QUEUE)
    public void consume(Message message) throws Exception {

        String messageId =
                message.getMessageProperties().getMessageId();

        if (messageId == null || messageId.isBlank()) {
            throw new IllegalArgumentException(
                    "RabbitMQ message is missing messageId"
            );
        }

        UUID eventId = UUID.fromString(messageId);

        String eventType =
                message.getMessageProperties().getHeader("eventType");

        if (!EXPECTED_EVENT_TYPE.equals(eventType)) {
            throw new IllegalArgumentException(
                    "Unsupported contract event type: " + eventType
            );
        }

        ContractSignedEvent event = objectMapper.readValue(
                message.getBody(),
                ContractSignedEvent.class
        );

        if (event.contractId() == null
                || event.contractVersionId() == null
                || event.versionNumber() == null
                || event.versionNumber() < 1) {
            throw new IllegalArgumentException(
                    "Contract signed event payload is invalid"
            );
        }

        log.info(
                "Received contract PDF event: eventId={}, contractId={}, version={}",
                eventId,
                event.contractId(),
                event.versionNumber()
        );

        contractPdfService.generateAndStore(eventId, event);

        log.info(
                "Successfully processed contract PDF event: eventId={}",
                eventId
        );
    }
}
