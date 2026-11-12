package com.renthub.contract.event;

import com.renthub.chat.dto.MessageResponse;

import java.util.UUID;

public record ContractCardCreatedEvent(
        UUID conversationId,
        UUID recipientId,
        MessageResponse message
) {
}