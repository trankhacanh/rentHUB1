package com.renthub.chat.entity;

import com.renthub.chat.enums.MessageType;
import com.renthub.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.renthub.contract.entity.ContractVersion;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@Setter
public class Message {

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
        name = "sender_id",
        nullable = false
    )
    private User sender;

    @Column(
        nullable = false,
        columnDefinition = "TEXT"
    )
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "message_type",
        nullable = false
    )
    private MessageType messageType;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_version_id")
    private ContractVersion contractVersion;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}