package com.renthub.chat.service;

import com.renthub.chat.dto.MessageResponse;
import com.renthub.chat.dto.SendMessageRequest;
import com.renthub.chat.entity.Conversation;
import com.renthub.chat.entity.Message;
import com.renthub.chat.enums.MessageType;
import com.renthub.chat.repository.ConversationParticipantRepository;
import com.renthub.chat.repository.ConversationRepository;
import com.renthub.chat.repository.MessageRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.chat.entity.MessageRead;
import com.renthub.chat.entity.MessageReadId;
import com.renthub.chat.repository.MessageReadRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MessageReadRepository messageReadRepository;

    /**
     * Gửi một message trong conversation.
     *
     * @param request  thông tin message từ client
     * @param senderId UUID của user đang gửi message
     * @return MessageResponse
     */
    @Transactional
public List<UUID> markConversationAsRead(
        UUID conversationId,
        UUID currentUserId
) {
    boolean participant =
            participantRepository.existsByConversationIdAndUserId(
                    conversationId,
                    currentUserId
            );

    if (!participant) {
        throw new IllegalArgumentException(
                "User is not a participant of this conversation"
        );
    }
        List<UUID> newlyReadMessageIds = new java.util.ArrayList<>();
    User user =
            userRepository.findById(currentUserId)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "User not found"
                            )
                    );

    List<Message> messages =
            messageRepository
                    .findByConversationIdAndSenderIdNotOrderByCreatedAtAsc(
                            conversationId,
                            currentUserId
                    );

    for (Message message : messages) {

        boolean alreadyRead =
                messageReadRepository
                        .existsByIdMessageIdAndIdUserId(
                                message.getId(),
                                currentUserId
                        );

        if (alreadyRead) {
            continue;
        }

        MessageReadId readId =
                new MessageReadId(
                        message.getId(),
                        currentUserId
                );

        MessageRead messageRead =
                new MessageRead();

        messageRead.setId(readId);
        messageRead.setMessage(message);
        messageRead.setUser(user);
        messageRead.setReadAt(Instant.now());

        messageReadRepository.save(messageRead);
        newlyReadMessageIds.add(message.getId());
    }
    return newlyReadMessageIds;
}

    @Transactional
    public MessageResponse sendMessage(
            SendMessageRequest request,
            UUID senderId
    ) {

        // 1. Validate content
        if (request.getContent() == null
                || request.getContent().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Message content cannot be empty"
            );
        }

        // 2. Tìm sender
        User sender = userRepository.findById(senderId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Sender not found"
                        )
                );

        // 3. Tìm conversation
        Conversation conversation =
                conversationRepository.findById(
                        request.getConversationId()
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Conversation not found"
                        )
                );

        // 4. Kiểm tra sender có thuộc conversation hay không
        boolean participant =
                participantRepository
                        .existsByConversationIdAndUserId(
                                conversation.getId(),
                                senderId
                        );

        if (!participant) {
            throw new IllegalArgumentException(
                    "User is not a participant of this conversation"
            );
        }

        // 5. Tạo message
        Message message = new Message();

        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent().trim());
        message.setMessageType(MessageType.TEXT);
        message.setCreatedAt(Instant.now());

        // 6. Lưu message vào database
        Message savedMessage =
                messageRepository.save(message);

        // 7. Cập nhật thời gian conversation
        conversation.setUpdatedAt(Instant.now());

        conversationRepository.save(conversation);

        // 8. Chuyển Entity -> DTO Response
        return toResponse(savedMessage, senderId);
    }

    /**
     * Lấy toàn bộ message của một conversation.
     *
     * Chỉ user là participant của conversation
     * mới được phép xem message.
     *
     * @param conversationId ID của conversation
     * @param currentUserId  ID của user hiện tại
     * @return danh sách messages
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(
            UUID conversationId,
            UUID currentUserId
    ) {

        // 1. Kiểm tra user có thuộc conversation không
        boolean participant =
                participantRepository
                        .existsByConversationIdAndUserId(
                                conversationId,
                                currentUserId
                        );

        if (!participant) {
            throw new IllegalArgumentException(
                    "User is not a participant of this conversation"
            );
        }

        // 2. Lấy messages theo thứ tự thời gian tăng dần
        return messageRepository
        .findByConversationIdOrderByCreatedAtAsc(
                conversationId
        )
        .stream()
        .map(message -> toResponse(message, currentUserId))
        .toList();
    }

    /**
     * Chuyển Message Entity thành MessageResponse DTO.
     */
    private MessageResponse toResponse(
        Message message,
        UUID currentUserId
) {

    String senderName =
            (
                    message.getSender().getFirstName()
                            + " "
                            + message.getSender().getLastName()
            ).trim();

    String status = "sent";

    boolean read =
            messageReadRepository.existsByIdMessageId(
                    message.getId()
            );

    if (read) {
        status = "read";
    }
        ContractVersion version = message.getContractVersion();
    return MessageResponse.builder()
            .id(message.getId())
            .conversationId(
                    message.getConversation().getId()
            )
            .senderId(
                    message.getSender().getId()
            )
            .senderName(senderName)
            .content(message.getContent())
            .messageType(message.getMessageType())
            .createdAt(message.getCreatedAt())
            .status(status)
            

            .contractId(
        version != null
                ? version.getContract().getId()
                : null
        )
        .contractVersionId(
                version != null
                        ? version.getId()
                        : null
        )
        .contractVersionNumber(
                version != null
                        ? version.getVersionNumber()
                        : null
        )
        .contractStatus(
                version != null
                        ? version.getContract().getStatus()
                        : null
        )
        .build();
}

/**
 * Create a contract card message.
 *
 * This method is only called by the contract workflow service.
 * Normal chat clients cannot create CONTRACT_CARD messages.
 */
@Transactional
public MessageResponse createContractCardMessage(
        Conversation conversation,
        User sender,
        ContractVersion version
) {

    if (conversation == null || sender == null || version == null) {
        throw new IllegalArgumentException(
                "Conversation, sender and contract version are required"
        );
    }

    if (!version.getContract().getOwner().getId()
            .equals(sender.getId())) {
        throw new IllegalArgumentException(
                "Only the contract owner can send this contract card"
        );
    }

    Message message = new Message();

    message.setConversation(conversation);
    message.setSender(sender);
    message.setContent("Contract sent for review");
    message.setMessageType(MessageType.CONTRACT_CARD);
    message.setContractVersion(version);
    message.setCreatedAt(Instant.now());

    Message savedMessage = messageRepository.saveAndFlush(message);

    conversation.setUpdatedAt(Instant.now());
    conversationRepository.save(conversation);

    return toResponse(savedMessage, sender.getId());
}


}