package com.renthub.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class ReadReceiptResponse {

    private String type;

    private UUID conversationId;

    private List<UUID> messageIds;

    private UUID readerId;
}