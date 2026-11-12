package com.renthub.chat.entity;

import com.renthub.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message_reads")
@Getter
@Setter
public class MessageRead {

    @EmbeddedId
    private MessageReadId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("messageId")
    @JoinColumn(name = "message_id")
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "read_at", nullable = false)
    private Instant readAt;
}