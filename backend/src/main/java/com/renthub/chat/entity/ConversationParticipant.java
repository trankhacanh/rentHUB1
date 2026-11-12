package com.renthub.chat.entity;

import com.renthub.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "conversation_participants",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_conversation_user",
            columnNames = {
                "conversation_id",
                "user_id"
            }
        )
    }
)
@Getter
@Setter
public class ConversationParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "conversation_id",
        nullable = false
    )
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_id",
        nullable = false
    )
    private User user;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;
}