package com.renthub.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class ConversationResponse {

    private UUID id;

    private UUID equipmentId;
    private String equipmentTitle;
    private BigDecimal pricePerDay;
    private String equipmentStatus;

    private UUID userId;
    private String userName;
    private String userEmail;
    private boolean online;
    private Instant lastSeenAt;
    private Instant createdAt;
    private Instant updatedAt;

    private String lastMessage;
    private Instant lastMessageAt;
    private int unreadCount;
}