package com.renthub.chat.controller;

import com.renthub.chat.dto.MessageResponse;
import com.renthub.chat.dto.SendMessageRequest;
import com.renthub.chat.service.MessageService;
import com.renthub.config.WebSocketAuthInterceptor;
import com.renthub.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import com.renthub.chat.repository.ConversationParticipantRepository;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationParticipantRepository participantRepository;


    @MessageMapping("/chat")
    public void sendMessage(
            SendMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor
    ) {

        // Lấy Authentication đã lưu từ lúc STOMP CONNECT
        Authentication authentication =
                (Authentication) headerAccessor
                        .getSessionAttributes()
                        .get(
                                WebSocketAuthInterceptor
                                        .getAuthSessionAttribute()
                        );

        if (authentication == null) {
            throw new IllegalArgumentException(
                    "WebSocket user is not authenticated"
            );
        }

        UserDetailsImpl userDetails =
                (UserDetailsImpl) authentication.getPrincipal();

        MessageResponse response =
                messageService.sendMessage(
                        request,
                        userDetails.getId()
                );

        // Broadcast message cho các client đang mở hội thoại.
messagingTemplate.convertAndSend(
        "/topic/conversations/"
                + request.getConversationId(),
        response
);

// Notify other participants so their header can refresh unread count.
participantRepository
        .findByConversationId(request.getConversationId())
        .stream()
  
.filter(participant ->
        participant.getUser() != null
                && !participant.getUser().getId()
                        .equals(userDetails.getId()))
.forEach(participant ->
        messagingTemplate.convertAndSend(
                "/topic/messages/"
                        + participant.getUser().getId(),
                java.util.Map.of(
                        "type", "NEW_MESSAGE",
                        "conversationId",
                        request.getConversationId().toString(),
                        "senderId",
                        userDetails.getId().toString()
                )
        )
);

    }
}