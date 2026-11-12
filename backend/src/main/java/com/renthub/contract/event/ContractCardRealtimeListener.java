package com.renthub.contract.event;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ContractCardRealtimeListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleContractCardCreated(
            ContractCardCreatedEvent event
    ) {

        // Deliver contract card to users subscribed to this conversation.
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + event.conversationId(),
                event.message()
        );

        // Notify renter's message badge.
        messagingTemplate.convertAndSend(
                "/topic/messages/" + event.recipientId(),
                Map.of(
                        "type", "NEW_MESSAGE",
                        "conversationId",
                        event.conversationId().toString(),
                        "senderId",
                        event.message().getSenderId().toString()
                )
        );
    }
}