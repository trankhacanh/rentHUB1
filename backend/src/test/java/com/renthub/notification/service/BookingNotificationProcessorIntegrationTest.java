package com.renthub.notification.service;

import com.renthub.notification.dto.BookingNotificationEvent;
import com.renthub.notification.entity.Notification;
import com.renthub.notification.repository.NotificationRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
class BookingNotificationProcessorIntegrationTest {

    @Autowired
    private BookingNotificationProcessor processor;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private NotificationRepository notificationRepository;

    @MockitoBean
    private UserRepository userRepository;

    private UUID eventId;

    @AfterEach
    void cleanUp() {
        if (eventId != null) {
            jdbcTemplate.update(
                    "DELETE FROM processed_message_events WHERE event_id = ?",
                    eventId
            );
        }

        reset(notificationRepository);
        reset(userRepository);
    }

    @Test
    void shouldCreateOnlyOneNotificationWhenSameEventIsProcessedTwice() {
        eventId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();

        User user = mock(User.class);
        when(user.getId()).thenReturn(recipientId);
        when(userRepository.findById(recipientId))
                .thenReturn(Optional.of(user));

        Notification savedNotification = mock(Notification.class);
        when(savedNotification.getId()).thenReturn(UUID.randomUUID());
        when(savedNotification.getUser()).thenReturn(user);
        when(savedNotification.getType()).thenReturn("BOOKING_APPROVED");
        when(savedNotification.getTitle()).thenReturn("Booking approved");
        when(savedNotification.getMessage()).thenReturn("Your booking was approved");
        when(savedNotification.getRead()).thenReturn(false);

        when(notificationRepository.saveAndFlush(any(Notification.class)))
                .thenReturn(savedNotification);

        BookingNotificationEvent event = new BookingNotificationEvent(
                recipientId,
                "BOOKING_APPROVED",
                "Booking approved",
                "Your booking was approved",
                UUID.randomUUID(),
                "BOOKING"
        );

        boolean firstResult = processor.process(eventId, event);
        boolean secondResult = processor.process(eventId, event);

        assertTrue(firstResult, "Lần đầu phải xử lý event");
        assertFalse(secondResult, "Lần hai phải nhận diện event trùng");

        verify(notificationRepository, times(1))
                .saveAndFlush(any(Notification.class));
    }

    @Test
    void shouldRollbackProcessedEventWhenRecipientDoesNotExist() {
        eventId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();

        when(userRepository.findById(recipientId))
                .thenReturn(Optional.empty());

        BookingNotificationEvent event = new BookingNotificationEvent(
                recipientId,
                "BOOKING_APPROVED",
                "Booking approved",
                "Your booking was approved",
                UUID.randomUUID(),
                "BOOKING"
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> processor.process(eventId, event)
        );

        Integer processedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM processed_message_events WHERE event_id = ?",
                Integer.class,
                eventId
        );

        assertEquals(
                0,
                processedCount,
                "Processed-event marker phải rollback cùng transaction"
        );

        verify(notificationRepository, never())
                .saveAndFlush(any(Notification.class));
    }
}