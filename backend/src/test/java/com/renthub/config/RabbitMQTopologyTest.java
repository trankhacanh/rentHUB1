package com.renthub.config;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class RabbitMQTopologyTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void shouldDeclareDurableBookingExchange() {
        DirectExchange exchange =
                applicationContext.getBean(
                        "bookingExchange",
                        DirectExchange.class
                );

        assertThat(exchange.getName())
                .isEqualTo(RabbitMQConfig.BOOKING_EXCHANGE);

        assertThat(exchange.isDurable()).isTrue();
        assertThat(exchange.isAutoDelete()).isFalse();
    }

    @Test
    void shouldDeclareDurableDeadLetterExchange() {
        DirectExchange exchange =
                applicationContext.getBean(
                        "bookingDeadLetterExchange",
                        DirectExchange.class
                );

        assertThat(exchange.getName())
                .isEqualTo(RabbitMQConfig.BOOKING_DLX);

        assertThat(exchange.isDurable()).isTrue();
        assertThat(exchange.isAutoDelete()).isFalse();
    }

    @Test
    void shouldDeclareDurableBookingQueueWithDeadLetterConfiguration() {
        Queue queue =
                applicationContext.getBean(
                        "bookingNotificationQueue",
                        Queue.class
                );

        assertThat(queue.getName())
                .isEqualTo(RabbitMQConfig.BOOKING_QUEUE);

        assertThat(queue.isDurable()).isTrue();
        assertThat(queue.isExclusive()).isFalse();
        assertThat(queue.isAutoDelete()).isFalse();

        assertThat(queue.getArguments())
                .containsEntry(
                        "x-dead-letter-exchange",
                        RabbitMQConfig.BOOKING_DLX
                )
                .containsEntry(
                        "x-dead-letter-routing-key",
                        RabbitMQConfig.BOOKING_DLQ_ROUTING_KEY
                );
    }

    @Test
    void shouldDeclareDurableDeadLetterQueue() {
        Queue queue =
                applicationContext.getBean(
                        "bookingNotificationDeadLetterQueue",
                        Queue.class
                );

        assertThat(queue.getName())
                .isEqualTo(RabbitMQConfig.BOOKING_DLQ);

        assertThat(queue.isDurable()).isTrue();
        assertThat(queue.isExclusive()).isFalse();
        assertThat(queue.isAutoDelete()).isFalse();
    }

    @Test
    void shouldBindBookingQueueToCorrectExchangeAndRoutingKey() {
        Binding binding =
                applicationContext.getBean(
                        "bookingNotificationBinding",
                        Binding.class
                );

        assertThat(binding.getExchange())
                .isEqualTo(RabbitMQConfig.BOOKING_EXCHANGE);

        assertThat(binding.getDestination())
                .isEqualTo(RabbitMQConfig.BOOKING_QUEUE);

        assertThat(binding.getRoutingKey())
                .isEqualTo(RabbitMQConfig.BOOKING_ROUTING_KEY);
    }

    @Test
    void shouldBindDeadLetterQueueToCorrectExchangeAndRoutingKey() {
        Binding binding =
                applicationContext.getBean(
                        "bookingNotificationDeadLetterBinding",
                        Binding.class
                );

        assertThat(binding.getExchange())
                .isEqualTo(RabbitMQConfig.BOOKING_DLX);

        assertThat(binding.getDestination())
                .isEqualTo(RabbitMQConfig.BOOKING_DLQ);

        assertThat(binding.getRoutingKey())
                .isEqualTo(RabbitMQConfig.BOOKING_DLQ_ROUTING_KEY);
    }
}