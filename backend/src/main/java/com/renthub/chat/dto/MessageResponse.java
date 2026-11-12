package com.renthub.chat.dto;

import com.renthub.chat.enums.MessageType;
import lombok.Builder;
import lombok.Getter;
import com.renthub.contract.enums.ContractStatus;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class MessageResponse {

    private UUID contractId;

    private UUID contractVersionId;

    private Integer contractVersionNumber;

    private ContractStatus contractStatus;

    private UUID id;

    private UUID conversationId;

    private UUID senderId;

    private String senderName;

    private String content;

    private MessageType messageType;

    private Instant createdAt;

    private String status;
}