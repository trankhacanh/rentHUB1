package com.renthub.chat.repository;

import com.renthub.chat.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MessageRepository
        extends JpaRepository<Message, UUID> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(
            UUID conversationId
    );

    List<Message> findByConversationIdOrderByCreatedAtDesc(
            UUID conversationId,
            Pageable pageable
    );
    List<Message> findByConversationIdAndSenderIdNotOrderByCreatedAtAsc(
        UUID conversationId,
        UUID senderId
);
        @Query("""
        SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
        FROM Message m
        WHERE m.conversation.id = :conversationId
        AND m.contractVersion.id = :versionId
        """)
        boolean existsContractCard(
                @Param("conversationId") UUID conversationId,
                @Param("versionId") UUID versionId
        );

}