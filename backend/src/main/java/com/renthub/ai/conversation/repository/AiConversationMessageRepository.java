package com.renthub.ai.conversation.repository;

import com.renthub.ai.conversation.entity.AiConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiConversationMessageRepository
        extends JpaRepository<AiConversationMessage, UUID> {

    List<AiConversationMessage>
    findTop10ByConversationIdOrderByCreatedAtDescIdDesc(
            UUID conversationId
    );

    List<AiConversationMessage>
    findByConversationIdOrderByCreatedAtAscIdAsc(
            UUID conversationId
    );

    Optional<AiConversationMessage>
    findFirstByConversationIdAndMessageRoleOrderByCreatedAtAscIdAsc(
            UUID conversationId,
            String messageRole
    );

    Optional<AiConversationMessage>
    findFirstByConversationIdOrderByCreatedAtDescIdDesc(
            UUID conversationId
    );
}