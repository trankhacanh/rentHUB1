package com.renthub.notification.service;

import com.renthub.notification.dto.BookingNotificationEvent;
import com.renthub.notification.dto.NotificationRealtimeResponse;
import com.renthub.notification.entity.Notification;
import com.renthub.notification.event.NotificationCreatedEvent;
import com.renthub.notification.repository.NotificationRepository;
import com.renthub.notification.repository.ProcessedMessageEventRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingNotificationProcessor {

    private final ProcessedMessageEventRepository processedEventRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional
    public boolean process(UUID eventId, BookingNotificationEvent event) {
        if (eventId == null) {
            throw new IllegalArgumentException("Event ID is required");
        }

        if (event == null) {
            throw new IllegalArgumentException("Booking notification event is required");
        }

        if (event.recipientId() == null) {
            throw new IllegalArgumentException("Notification recipient ID is required");
        }

        if (event.type() == null || event.type().isBlank()) {
            throw new IllegalArgumentException("Notification type is required");
        }

        if (event.title() == null || event.title().isBlank()) {
            throw new IllegalArgumentException("Notification title is required");
        }

        int inserted = processedEventRepository.insertIfAbsent(eventId);

        if (inserted == 0) {
            return false;
        }

        User user = userRepository.findById(event.recipientId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Notification recipient not found: " + event.recipientId()
                ));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(event.type());
        notification.setTitle(event.title());
        notification.setMessage(event.message());
        notification.setRead(false);
        notification.setReferenceId(event.referenceId());
        notification.setReferenceType(event.referenceType());

        Notification saved = notificationRepository.saveAndFlush(notification);

        NotificationRealtimeResponse response = new NotificationRealtimeResponse();
        response.setId(saved.getId());
        response.setUserId(user.getId());
        response.setType(saved.getType());
        response.setTitle(saved.getTitle());
        response.setMessage(saved.getMessage());
        response.setRead(saved.getRead());
        response.setReferenceId(saved.getReferenceId());
        response.setReferenceType(saved.getReferenceType());
        response.setCreatedAt(saved.getCreatedAt());

        applicationEventPublisher.publishEvent(
                new NotificationCreatedEvent(response)
        );

        return true;
    }
}
