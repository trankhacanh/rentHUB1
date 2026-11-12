package com.renthub.chat.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import com.renthub.chat.dto.PresenceEvent;
import com.renthub.chat.entity.ConversationParticipant;
import com.renthub.chat.repository.ConversationParticipantRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PresenceBroadcastService {

    private final ConversationParticipantRepository participantRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public void broadcastOnline(UUID userId) {
        broadcast(
                userId,
                PresenceEvent.online(userId)
        );
    }

    @Transactional(readOnly = true)
    public void broadcastOffline(
            UUID userId,
            Instant lastSeenAt
    ) {
        broadcast(
                userId,
                PresenceEvent.offline(userId, lastSeenAt)
        );
    }

    private void broadcast(
            UUID userId,
            PresenceEvent event
    ) {
        if (userId == null) {
            return;
        }

        Set<UUID> conversationIds = new HashSet<>();

        for (ConversationParticipant participant :
                participantRepository.findByUserId(userId)) {

            if (participant.getConversation() != null
                    && participant.getConversation().getId() != null) {

                conversationIds.add(
                        participant.getConversation().getId()
                );
            }
        }

        for (UUID conversationId : conversationIds) {
            messagingTemplate.convertAndSend(
                    "/topic/conversations/"
                            + conversationId
                            + "/presence",
                    event
            );
        }
    }
}