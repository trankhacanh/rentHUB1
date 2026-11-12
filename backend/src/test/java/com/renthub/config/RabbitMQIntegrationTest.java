package com.renthub.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.notification.dto.BookingNotificationEvent;
import com.renthub.outbox.repository.OutboxEventRepository;
import com.renthub.outbox.service.OutboxPublishingStateService;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.CorrelationData.Confirm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {
        "renthub.outbox.publisher.enabled=false"
})
class RabbitMQIntegrationTest {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private RabbitAdmin rabbitAdmin;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Test 1:
     * Publish qua exchange thật và kiểm tra message được route
     * đến một queue kiểm thử riêng.
     */
    @Test
    void shouldPublishAndRouteMessageThroughRealRabbitMQ() throws Exception {
        String queueName = "renthub.test.routing." + UUID.randomUUID();

        Queue testQueue = QueueBuilder
                .durable(queueName)
                .build();

        rabbitAdmin.declareQueue(testQueue);

        Binding binding = BindingBuilder
                .bind(testQueue)
                .to(new org.springframework.amqp.core.DirectExchange(
                        RabbitMQConfig.BOOKING_EXCHANGE
                ))
                .with(RabbitMQConfig.BOOKING_ROUTING_KEY);

        rabbitAdmin.declareBinding(binding);

        UUID messageId = UUID.randomUUID();
        String payload = "{\"testId\":\"" + messageId + "\"}";

        try {
            CorrelationData correlationData =
                    new CorrelationData(messageId.toString());

            rabbitTemplate.send(
                    RabbitMQConfig.BOOKING_EXCHANGE,
                    RabbitMQConfig.BOOKING_ROUTING_KEY,
                    new Message(
                            payload.getBytes(StandardCharsets.UTF_8)
                    ),
                    correlationData
            );

            Confirm confirm = correlationData
                    .getFuture()
                    .get(10, TimeUnit.SECONDS);

            assertThat(confirm.isAck())
                    .as("RabbitMQ phải ACK message")
                    .isTrue();

            Message received = rabbitTemplate.receive(
                    queueName,
                    5_000
            );

            assertThat(received)
                    .as("Queue kiểm thử phải nhận được message")
                    .isNotNull();

            assertThat(new String(
                    received.getBody(),
                    StandardCharsets.UTF_8
            )).isEqualTo(payload);

        } finally {
            rabbitAdmin.deleteQueue(queueName);
        }
    }

    /**
     * Test 2:
     * Publish tới routing key không tồn tại.
     *
     * Kiểm tra publisher confirm và returned message.
     */
    @Test
    void shouldReturnMessageWhenRoutingKeyDoesNotMatch()
            throws Exception {

        String invalidRoutingKey =
                "renthub.test.unroutable." + UUID.randomUUID();

        UUID messageId = UUID.randomUUID();

        CorrelationData correlationData =
                new CorrelationData(messageId.toString());

        rabbitTemplate.send(
                RabbitMQConfig.BOOKING_EXCHANGE,
                invalidRoutingKey,
                new Message(
                        "{}".getBytes(StandardCharsets.UTF_8)
                ),
                correlationData
        );

        Confirm confirm = correlationData
                .getFuture()
                .get(10, TimeUnit.SECONDS);

        assertThat(confirm.isAck())
                .as("Broker vẫn có thể ACK việc publish")
                .isTrue();

        assertThat(correlationData.getReturned())
                .as("Message không route được phải được trả về")
                .isNotNull();
    }

    /**
     * Test 3:
     * Gửi event có recipient không tồn tại qua RabbitMQ thật.
     *
     * Consumer sẽ thất bại khi xử lý event. Sau khi retry cạn,
     * message dự kiến được chuyển vào DLQ theo cấu hình hiện tại.
     */
@Test
void shouldSendFailedConsumerMessageToDeadLetterQueue() throws Exception {
    UUID eventId = UUID.randomUUID();

    BookingNotificationEvent event = new BookingNotificationEvent(
            UUID.randomUUID(),
            "BOOKING_APPROVED",
            "RabbitMQ integration test",
            "Recipient intentionally does not exist",
            UUID.randomUUID(),
            "BOOKING"
    );

    Message message = new Message(objectMapper.writeValueAsBytes(event));
    message.getMessageProperties().setMessageId(eventId.toString());
    message.getMessageProperties().setContentType("application/json");

    rabbitTemplate.send(
            RabbitMQConfig.BOOKING_EXCHANGE,
            RabbitMQConfig.BOOKING_ROUTING_KEY,
            message
    );

    long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(20);
    Message matchingMessage = null;

    while (System.nanoTime() < deadline) {
        Message received = rabbitTemplate.receive(RabbitMQConfig.BOOKING_DLQ);

        if (received == null) {
            Thread.sleep(200);
            continue;
        }

        String receivedMessageId =
                received.getMessageProperties().getMessageId();

        if (eventId.toString().equals(receivedMessageId)) {
            matchingMessage = received;
            break;
        }

        // Không xóa message cũ: đưa nó trở lại DLQ.
        rabbitTemplate.send(
                RabbitMQConfig.BOOKING_DLX,
                RabbitMQConfig.BOOKING_DLQ_ROUTING_KEY,
                received
        );

        Thread.sleep(100);
    }

    assertThat(matchingMessage)
            .as("Message của lần test hiện tại phải xuất hiện trong DLQ")
            .isNotNull();

    assertThat(matchingMessage.getMessageProperties().getMessageId())
            .isEqualTo(eventId.toString());
}

    /**
     * Test 4:
     * Kiểm tra logic retry của Outbox khi publish thất bại.
     *
     * Đây là unit test dùng mock repository, không gửi message
     * qua RabbitMQ.
     */
    @Test
    void shouldScheduleRetryWhenOutboxPublishingFails() {
        OutboxEventRepository repository =
                mock(OutboxEventRepository.class);

        OutboxPublishingStateService service =
                new OutboxPublishingStateService(repository);

        UUID eventId = UUID.randomUUID();

        when(repository.scheduleRetry(
                eq(eventId),
                eq("PENDING"),
                any(),
                anyString()
        )).thenReturn(1);

        service.scheduleRetry(
                eventId,
                0,
                new RuntimeException("Simulated publish failure")
        );

        verify(repository).scheduleRetry(
                eq(eventId),
                eq("PENDING"),
                any(),
                contains("Simulated publish failure")
        );
    }

    /**
     * Test 5:
     * Kiểm tra event đạt ngưỡng retry được chuyển sang FAILED.
     *
     * MAX_RETRIES hiện tại bằng 8.
     */
    @Test
    void shouldMarkOutboxEventFailedAfterRetryLimit() {
        OutboxEventRepository repository =
                mock(OutboxEventRepository.class);

        OutboxPublishingStateService service =
                new OutboxPublishingStateService(repository);

        UUID eventId = UUID.randomUUID();

        when(repository.scheduleRetry(
                eq(eventId),
                eq("FAILED"),
                any(),
                anyString()
        )).thenReturn(1);

        service.scheduleRetry(
                eventId,
                7,
                new RuntimeException("Retry limit reached")
        );

        verify(repository).scheduleRetry(
                eq(eventId),
                eq("FAILED"),
                any(),
                contains("Retry limit reached")
        );
    }
}