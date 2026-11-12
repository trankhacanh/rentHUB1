package com.renthub.chat.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SendMessageRequest {

    private UUID conversationId;

    private String content;
}