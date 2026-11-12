package com.renthub.notification.controller;

import com.renthub.notification.dto.NotificationResponse;
import com.renthub.notification.service.NotificationService;
import com.renthub.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        List<NotificationResponse> notifications =
                notificationService.getMyNotifications(
                        userDetails.getId()
                );

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        List<NotificationResponse> notifications =
                notificationService.getUnreadNotifications(
                        userDetails.getId()
                );

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> countUnreadNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        long count =
                notificationService.countUnreadNotifications(
                        userDetails.getId()
                );

        return ResponseEntity.ok(count);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        NotificationResponse response =
                notificationService.markAsRead(
                        notificationId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        notificationService.markAllAsRead(
                userDetails.getId()
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        notificationService.deleteNotification(
                notificationId,
                userDetails.getId()
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test")
public ResponseEntity<NotificationResponse> createTestNotification(
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {
    NotificationResponse notification =
            notificationService.createNotification(
                    userDetails.getId(),
                    "TEST",
                    "Thông báo realtime",
                    "Đây là notification realtime test của RentHub.",
                    null,
                    null
            );

    return ResponseEntity.ok(notification);
}

}