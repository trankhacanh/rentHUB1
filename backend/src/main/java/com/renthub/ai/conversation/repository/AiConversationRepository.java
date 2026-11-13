package com.renthub.ai.conversation.repository;

import com.renthub.ai.conversation.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiConversationRepository
        extends JpaRepository<AiConversation, UUID> {

    Optional<AiConversation> findByIdAndUserId(
            UUID id,
            UUID userId
    );

    List<AiConversation> findTop50ByUserIdOrderByUpdatedAtDesc(
            UUID userId
    );
}