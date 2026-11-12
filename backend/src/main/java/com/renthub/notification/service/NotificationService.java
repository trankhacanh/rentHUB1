package com.renthub.notification.service;

import com.renthub.notification.dto.NotificationResponse;
import com.renthub.notification.entity.Notification;
import com.renthub.notification.repository.NotificationRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.renthub.notification.dto.NotificationRealtimeResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;


    @Transactional
public NotificationResponse createNotification(
        UUID userId,
        String type,
        String title,
        String message,
        UUID referenceId,
        String referenceType
) {

    if (userId == null) {
        throw new IllegalArgumentException(
                "User ID is required"
        );
    }

    if (type == null || type.isBlank()) {
        throw new IllegalArgumentException(
                "Notification type is required"
        );
    }

    if (title == null || title.isBlank()) {
        throw new IllegalArgumentException(
                "Notification title is required"
        );
    }

    User user = userRepository.findById(userId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "User not found"
                    )
            );

    Notification notification =
            new Notification();

    notification.setUser(user);
    notification.setType(type);
    notification.setTitle(title);
    notification.setMessage(message);
    notification.setRead(false);
    notification.setReferenceId(referenceId);
    notification.setReferenceType(referenceType);

    Notification savedNotification =
            notificationRepository.saveAndFlush(
                    notification
            );

    // Create realtime response
    NotificationRealtimeResponse realtimeResponse =
            new NotificationRealtimeResponse();

    realtimeResponse.setId(savedNotification.getId());
    realtimeResponse.setUserId(
            savedNotification.getUser().getId()
    );
    realtimeResponse.setType(
            savedNotification.getType()
    );
    realtimeResponse.setTitle(
            savedNotification.getTitle()
    );
    realtimeResponse.setMessage(
            savedNotification.getMessage()
    );
    realtimeResponse.setRead(
            savedNotification.getRead()
    );
    realtimeResponse.setReferenceId(
            savedNotification.getReferenceId()
    );
    realtimeResponse.setReferenceType(
            savedNotification.getReferenceType()
    );
    realtimeResponse.setCreatedAt(
            savedNotification.getCreatedAt()
    );

    // Send realtime notification to this user
    messagingTemplate.convertAndSend(
            "/topic/notifications/"
                    + savedNotification.getUser().getId(),
            realtimeResponse
    );

    return toResponse(savedNotification);
}

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(
            UUID userId
    ) {

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(
            UUID userId
    ) {

        return notificationRepository
                .findByUserIdAndReadFalseOrderByCreatedAtDesc(
                        userId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnreadNotifications(
            UUID userId
    ) {

        return notificationRepository
                .countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(
            UUID notificationId,
            UUID userId
    ) {

        Notification notification =
                notificationRepository.findById(
                        notificationId
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Notification not found"
                        )
                );

        if (!notification.getUser()
                .getId()
                .equals(userId)) {

            throw new IllegalArgumentException(
                    "You are not the owner of this notification"
            );
        }

        notification.setRead(true);

        Notification savedNotification =
                notificationRepository.saveAndFlush(
                        notification
                );

        return toResponse(savedNotification);
    }

    @Transactional
    public void markAllAsRead(
            UUID userId
    ) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserIdAndReadFalseOrderByCreatedAtDesc(
                                userId
                        );

        notifications.forEach(
                notification ->
                        notification.setRead(true)
        );

        notificationRepository.saveAllAndFlush(
                notifications
        );
    }

    @Transactional
    public void deleteNotification(
            UUID notificationId,
            UUID userId
    ) {

        Notification notification =
                notificationRepository.findById(
                        notificationId
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Notification not found"
                        )
                );

        if (!notification.getUser()
                .getId()
                .equals(userId)) {

            throw new IllegalArgumentException(
                    "You are not the owner of this notification"
            );
        }

        notificationRepository.delete(notification);
    }

    private NotificationResponse toResponse(
            Notification notification
    ) {

        NotificationResponse response =
                new NotificationResponse();

        response.setId(
                notification.getId()
        );

        response.setUserId(
                notification.getUser().getId()
        );

        response.setType(
                notification.getType()
        );

        response.setTitle(
                notification.getTitle()
        );

        response.setMessage(
                notification.getMessage()
        );

        response.setRead(
                notification.getRead()
        );

        response.setReferenceId(
                notification.getReferenceId()
        );

        response.setReferenceType(
                notification.getReferenceType()
        );

        response.setCreatedAt(
                notification.getCreatedAt()
        );

        return response;
    }
}