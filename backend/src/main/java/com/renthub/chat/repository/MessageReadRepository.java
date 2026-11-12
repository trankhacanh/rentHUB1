package com.renthub.chat.repository;

import com.renthub.chat.entity.MessageRead;
import com.renthub.chat.entity.MessageReadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface MessageReadRepository
        extends JpaRepository<MessageRead, MessageReadId> {

    boolean existsByIdMessageIdAndIdUserId(
            UUID messageId,
            UUID userId
    );

    boolean existsByIdMessageId(
            UUID messageId
    );

    @Query("""
        SELECT COUNT(m)
        FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.sender.id <> :userId
          AND NOT EXISTS (
              SELECT 1
              FROM MessageRead mr
              WHERE mr.id.messageId = m.id
                AND mr.id.userId = :userId
          )
    """)
    long countUnreadMessages(
            @Param("conversationId") UUID conversationId,
            @Param("userId") UUID userId
    );
}