package com.renthub.chat.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateConversationRequest {

    private UUID userId;

    private UUID equipmentId;
}