package com.renthub.chat.controller;

import java.util.UUID;

import com.renthub.chat.service.PresenceService;
import com.renthub.security.services.UserDetailsImpl;

import lombok.RequiredArgsConstructor;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    @MessageMapping("/presence/heartbeat")
    public void heartbeat(
            Authentication authentication,
            SimpMessageHeaderAccessor accessor
    ) {
        if (authentication == null
                || !(authentication.getPrincipal()
                instanceof UserDetailsImpl userDetails)) {
            throw new AuthenticationCredentialsNotFoundException(
                    "WebSocket user is not authenticated"
            );
        }

        UUID userId = userDetails.getId();
        String sessionId = accessor.getSessionId();

        if (sessionId == null) {
            return;
        }

        presenceService.heartbeat(userId, sessionId);
    }
}