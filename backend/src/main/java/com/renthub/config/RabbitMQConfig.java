package com.renthub.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String BOOKING_EXCHANGE = "renthub.booking.exchange";
    public static final String BOOKING_QUEUE = "renthub.booking.notification.queue";
    public static final String BOOKING_ROUTING_KEY = "booking.notification";

    public static final String BOOKING_DLX = "renthub.booking.dlx";
    public static final String BOOKING_DLQ = "renthub.booking.notification.dlq";
    public static final String BOOKING_DLQ_ROUTING_KEY = "booking.notification.dead";
    public static final String CONTRACT_EXCHANGE =
        "renthub.contract.exchange";

    public static final String CONTRACT_PDF_QUEUE =
            "renthub.contract.pdf.queue";

    public static final String CONTRACT_PDF_ROUTING_KEY =
            "contract.pdf.generate";

    public static final String CONTRACT_DLX =
            "renthub.contract.dlx";

    public static final String CONTRACT_PDF_DLQ =
            "renthub.contract.pdf.dlq";

    public static final String CONTRACT_PDF_DLQ_ROUTING_KEY =
            "contract.pdf.dead";
    @Bean
    public DirectExchange bookingExchange() {
        return new DirectExchange(BOOKING_EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange bookingDeadLetterExchange() {
        return new DirectExchange(BOOKING_DLX, true, false);
    }

    @Bean
    public Queue bookingNotificationQueue() {
        return QueueBuilder.durable(BOOKING_QUEUE)
                .deadLetterExchange(BOOKING_DLX)
                .deadLetterRoutingKey(BOOKING_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Queue bookingNotificationDeadLetterQueue() {
        return QueueBuilder.durable(BOOKING_DLQ).build();
    }

    @Bean
    public Binding bookingNotificationBinding() {
        return BindingBuilder
                .bind(bookingNotificationQueue())
                .to(bookingExchange())
                .with(BOOKING_ROUTING_KEY);
    }

    @Bean
    public Binding bookingNotificationDeadLetterBinding() {
        return BindingBuilder
                .bind(bookingNotificationDeadLetterQueue())
                .to(bookingDeadLetterExchange())
                .with(BOOKING_DLQ_ROUTING_KEY);
    }
    @Bean
public DirectExchange contractExchange() {
    return new DirectExchange(CONTRACT_EXCHANGE, true, false);
}

@Bean
public DirectExchange contractDeadLetterExchange() {
    return new DirectExchange(CONTRACT_DLX, true, false);
}

@Bean
public Queue contractPdfQueue() {
    return QueueBuilder.durable(CONTRACT_PDF_QUEUE)
            .deadLetterExchange(CONTRACT_DLX)
            .deadLetterRoutingKey(CONTRACT_PDF_DLQ_ROUTING_KEY)
            .build();
}

@Bean
public Queue contractPdfDeadLetterQueue() {
    return QueueBuilder.durable(CONTRACT_PDF_DLQ).build();
}

@Bean
public Binding contractPdfBinding() {
    return BindingBuilder
            .bind(contractPdfQueue())
            .to(contractExchange())
            .with(CONTRACT_PDF_ROUTING_KEY);
}

@Bean
public Binding contractPdfDeadLetterBinding() {
    return BindingBuilder
            .bind(contractPdfDeadLetterQueue())
            .to(contractDeadLetterExchange())
            .with(CONTRACT_PDF_DLQ_ROUTING_KEY);
}   
}