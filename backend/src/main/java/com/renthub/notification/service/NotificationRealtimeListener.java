package com.renthub.notification.service;

import com.renthub.notification.event.NotificationCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRealtimeListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotificationCreated(NotificationCreatedEvent event) {
        var notification = event.notification();

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + notification.getUserId(),
                notification
        );

        log.debug(
                "Sent realtime notification {} to user {} after transaction commit",
                notification.getId(),
                notification.getUserId()
        );
    }
}
