package com.renthub.chat.repository;

import com.renthub.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository
        extends JpaRepository<Conversation, UUID> {

    @Query("""
        SELECT c
        FROM Conversation c
        JOIN c.equipment e
        JOIN ConversationParticipant cp
            ON cp.conversation.id = c.id
        WHERE e.id = :equipmentId
          AND e.owner.id = :ownerId
          AND cp.user.id = :currentUserId
    """)
    Optional<Conversation> findExistingConversation(
            @Param("equipmentId") UUID equipmentId,
            @Param("ownerId") UUID ownerId,
            @Param("currentUserId") UUID currentUserId
    );


    @Query("""
    SELECT c
    FROM Conversation c
    WHERE c.equipment.id = :equipmentId
      AND EXISTS (
          SELECT cpOwner.id
          FROM ConversationParticipant cpOwner
          WHERE cpOwner.conversation.id = c.id
            AND cpOwner.user.id = :ownerId
      )
      AND EXISTS (
          SELECT cpRenter.id
          FROM ConversationParticipant cpRenter
          WHERE cpRenter.conversation.id = c.id
            AND cpRenter.user.id = :renterId
      )
    ORDER BY c.updatedAt DESC
""")
List<Conversation> findMatchingContractConversation(
        @Param("equipmentId") UUID equipmentId,
        @Param("ownerId") UUID ownerId,
        @Param("renterId") UUID renterId
);

}