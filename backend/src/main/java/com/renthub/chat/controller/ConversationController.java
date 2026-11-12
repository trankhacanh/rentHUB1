package com.renthub.chat.controller;

import com.renthub.chat.dto.ConversationResponse;
import com.renthub.chat.dto.CreateConversationRequest;
import com.renthub.chat.dto.MessageResponse;
import com.renthub.chat.service.ConversationService;
import com.renthub.chat.service.MessageService;
import com.renthub.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.renthub.chat.dto.ReadReceiptResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;
        private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(
            @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {

        UUID currentUserId = currentUser.getId();

        return ResponseEntity.ok(
                conversationService.createConversation(
                        request,
                        currentUserId
                )
        );
    }

        @GetMapping
public ResponseEntity<List<ConversationResponse>> getMyConversations(
        @AuthenticationPrincipal UserDetailsImpl currentUser
) {
    UUID currentUserId = currentUser.getId();

    return ResponseEntity.ok(
            conversationService.getMyConversations(currentUserId)
    );
}

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {

        UUID currentUserId = currentUser.getId();

        return ResponseEntity.ok(
                messageService.getMessages(
                        conversationId,
                        currentUserId
                )
        );
    }

@PostMapping("/{conversationId}/read")
public ResponseEntity<Void> markAsRead(
        @PathVariable UUID conversationId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    List<UUID> messageIds =
            messageService.markConversationAsRead(
                    conversationId,
                    userDetails.getId()
            );

    if (!messageIds.isEmpty()) {

        ReadReceiptResponse receipt =
                ReadReceiptResponse.builder()
                        .type("READ_RECEIPT")
                        .conversationId(conversationId)
                        .messageIds(messageIds)
                        .readerId(userDetails.getId())
                        .build();

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId,
                receipt
        );
    }

    return ResponseEntity.noContent().build();
}

}