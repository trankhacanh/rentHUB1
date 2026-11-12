package com.renthub.chat.repository;

import com.renthub.chat.entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationParticipantRepository
        extends JpaRepository<ConversationParticipant, UUID> {

    List<ConversationParticipant> findByUserId(UUID userId);

    List<ConversationParticipant> findByConversationId(
            UUID conversationId
    );

    boolean existsByConversationIdAndUserId(
            UUID conversationId,
            UUID userId
    );
}