package com.renthub.chat.service;

import com.renthub.chat.dto.ConversationResponse;
import com.renthub.chat.dto.CreateConversationRequest;
import com.renthub.chat.entity.Conversation;
import com.renthub.chat.entity.ConversationParticipant;
import com.renthub.chat.entity.Message;
import com.renthub.chat.repository.ConversationParticipantRepository;
import com.renthub.chat.repository.ConversationRepository;
import com.renthub.chat.repository.MessageRepository;
import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.repository.EquipmentRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import com.renthub.chat.repository.MessageReadRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;

    private final ConversationParticipantRepository participantRepository;

    private final UserRepository userRepository;

    private final EquipmentRepository equipmentRepository;

    private final MessageRepository messageRepository;

        private final MessageReadRepository messageReadRepository;
private final PresenceService presenceService;

    @Transactional
public ConversationResponse createConversation(
        CreateConversationRequest request,
        UUID currentUserId
) {

    User currentUser =
            userRepository.findById(currentUserId)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Current user not found"
                            )
                    );

    User otherUser =
            userRepository.findById(request.getUserId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "User not found"
                            )
                    );

    Equipment equipment =
            equipmentRepository
                    .findById(request.getEquipmentId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Equipment not found"
                            )
                    );

    /*
     * Kiểm tra user hiện tại có đang cố tạo
     * conversation với chính mình hay không.
     */
    if (currentUserId.equals(otherUser.getId())) {
        throw new IllegalArgumentException(
                "Cannot create conversation with yourself"
        );
    }

    /*
     * Kiểm tra conversation đã tồn tại.
     *
     * Trường hợp:
     *
     * Current User = A
     * Owner        = B
     * Equipment    = X
     *
     * Nếu A đã từng chat với B về X
     * → lấy conversation cũ.
     */
    var existingConversation =
            conversationRepository.findExistingConversation(
                    equipment.getId(),
                    otherUser.getId(),
                    currentUserId
            );

    if (existingConversation.isPresent()) {

        Conversation conversation =
                existingConversation.get();

        return ConversationResponse.builder()
                .id(conversation.getId())
                .equipmentId(equipment.getId())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    /*
     * Chưa có conversation
     * → tạo conversation mới.
     */
    Conversation conversation =
            new Conversation();

    Instant now = Instant.now();

    conversation.setEquipment(equipment);
    conversation.setCreatedAt(now);
    conversation.setUpdatedAt(now);

    conversation =
            conversationRepository.save(conversation);

    /*
     * Participant 1:
     * current user
     */
    ConversationParticipant participant1 =
            new ConversationParticipant();

    participant1.setConversation(conversation);
    participant1.setUser(currentUser);
    participant1.setJoinedAt(now);

    /*
     * Participant 2:
     * equipment owner
     */
    ConversationParticipant participant2 =
            new ConversationParticipant();

    participant2.setConversation(conversation);
    participant2.setUser(otherUser);
    participant2.setJoinedAt(now);

    participantRepository.save(participant1);
    participantRepository.save(participant2);

    return ConversationResponse.builder()
            .id(conversation.getId())
            .equipmentId(equipment.getId())
            .createdAt(conversation.getCreatedAt())
            .updatedAt(conversation.getUpdatedAt())
            .build();
}

    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(
            UUID currentUserId
    ) {

        // 1. Lấy tất cả conversation mà current user tham gia
        List<ConversationParticipant> myParticipants =
                participantRepository.findByUserId(currentUserId);

        return myParticipants.stream()

                // 2. Lấy Conversation từ participant
                .map(ConversationParticipant::getConversation)

                // 3. Conversation mới cập nhật lên trước
                .sorted(
                        Comparator.comparing(
                                Conversation::getUpdatedAt
                        ).reversed()
                )

                // 4. Chuyển từng Conversation thành ConversationResponse
                .map(conversation -> {

                    Equipment equipment =
                            conversation.getEquipment();
                // Find the other participant.
     

             
                    /*
                     * Tìm participant còn lại.
                     *
                     * Conversation có:
                     *
                     * User A ← participant
                     * User B ← participant
                     *
                     * currentUserId = User A
                     *
                     * → lấy User B
                     */
                    User otherUser =
                            participantRepository
                                    .findByConversationId(
                                            conversation.getId()
                                    )
                                    .stream()
                                    .map(
                                            ConversationParticipant::getUser
                                    )
                                    .filter(user ->
                                            !user.getId()
                                                    .equals(currentUserId)
                                    )
                                    .findFirst()
                                    .orElse(null);
                        boolean otherUserOnline = otherUser != null
                                && presenceService.isOnline(otherUser.getId());

                        Instant otherUserLastSeenAt =
                                otherUser == null || otherUserOnline
                                        ? null
                                        : presenceService.getLastSeenAt(otherUser.getId());
                    /*
                     * Lấy message mới nhất.
                     */
                    List<Message> messages =
                            messageRepository
                                    .findByConversationIdOrderByCreatedAtDesc(
                                            conversation.getId(),
                                            PageRequest.of(0, 1)
                                    );

                    Message lastMessage =
                            messages.isEmpty()
                                    ? null
                                    : messages.get(0);

                        long unreadCount =
                        messageReadRepository.countUnreadMessages(
                                conversation.getId(),
                                currentUserId
                        );
                    /*
                     * Tạo response trả về frontend.
                     */
                    return ConversationResponse.builder()

                            .id(conversation.getId())

                            // Equipment
                            .equipmentId(
                                    equipment != null
                                            ? equipment.getId()
                                            : null
                            )
                                
                            .equipmentTitle(
                                    equipment != null
                                            ? equipment.getTitle()
                                            : null
                            )

                            .pricePerDay(
                                    equipment != null
                                            ? equipment.getPricePerDay()
                                            : null
                            )

                            .equipmentStatus(
                                    equipment != null
                                            ? equipment.getStatus()
                                            : null
                            )

                            // Other user
                            .userId(
                                    otherUser != null
                                            ? otherUser.getId()
                                            : null
                            )

                            .userName(
                                    otherUser != null
                                            ? (
                                                otherUser.getFirstName()
                                                + " "
                                                + otherUser.getLastName()
                                            ).trim()
                                            : null
                            )

                            .userEmail(
                                    otherUser != null
                                            ? otherUser.getEmail()
                                            : null
                            )
                        .online(otherUserOnline)
                        .lastSeenAt(otherUserLastSeenAt)
                            // Conversation
                            .createdAt(
                                    conversation.getCreatedAt()
                            )

                            .updatedAt(
                                    conversation.getUpdatedAt()
                            )

                            // Last message
                            .lastMessage(
                                    lastMessage != null
                                            ? lastMessage.getContent()
                                            : null
                            )

                            .lastMessageAt(
                                    lastMessage != null
                                            ? lastMessage.getCreatedAt()
                                            : null
                            )
                                .unreadCount((int) unreadCount)
                            .build();
                })

                .toList();
    }
}