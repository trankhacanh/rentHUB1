package com.renthub.chat.service;

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

import com.renthub.security.services.UserDetailsImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import com.renthub.config.WebSocketAuthInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceWebSocketEventListener {

    private final PresenceService presenceService;
    private final PresenceBroadcastService presenceBroadcastService;

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        Authentication authentication =
        resolveAuthentication(
                event.getUser(),
                event.getMessage()
        );

        if (authentication == null) {
            log.warn("WebSocket connected without authenticated principal");
            return;
        }

        UUID userId = extractUserId(authentication);

        String sessionId = StompHeaderAccessor
                .wrap(event.getMessage())
                .getSessionId();

        if (sessionId == null) {
            log.warn("WebSocket connected without session ID");
            return;
        }

        long transition = presenceService.connect(userId, sessionId);

        if (transition == 1) {
            presenceBroadcastService.broadcastOnline(userId);
        }

        log.debug(
                "User {} connected with WebSocket session {}; transition={}",
                userId,
                sessionId,
                transition
        );
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        Authentication authentication = getAuthentication(event.getUser());

        if (authentication == null) {
            return;
        }

        String sessionId = StompHeaderAccessor
                .wrap(event.getMessage())
                .getSessionId();

        if (sessionId == null) {
            return;
        }

        UUID userId = extractUserId(authentication);

        long transition = presenceService.disconnect(userId, sessionId);

       if (transition == -1) {
    Instant lastSeenAt = presenceService.getLastSeenAt(userId);

    presenceBroadcastService.broadcastOffline(
            userId,
            lastSeenAt != null ? lastSeenAt : Instant.now()
    );
}

        log.debug(
                "User {} disconnected WebSocket session {}; transition={}",
                userId,
                sessionId,
                transition
        );
    }

    private Authentication getAuthentication(Principal principal) {
        if (principal instanceof Authentication authentication) {
            return authentication;
        }

        return null;
    }

    private UUID extractUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (!(principal instanceof UserDetailsImpl userDetails)) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Unexpected WebSocket principal type"
            );
        }

        return userDetails.getId();
    }

    private Authentication resolveAuthentication(
        Principal principal,
        org.springframework.messaging.Message<?> message
) {
    if (principal instanceof Authentication authentication) {
        return authentication;
    }

    StompHeaderAccessor accessor =
            StompHeaderAccessor.wrap(message);

    Object value = accessor.getSessionAttributes() == null
            ? null
            : accessor.getSessionAttributes().get(
                    WebSocketAuthInterceptor.getAuthSessionAttribute()
            );

    if (value instanceof Authentication authentication) {
        return authentication;
    }

    return null;
}



}