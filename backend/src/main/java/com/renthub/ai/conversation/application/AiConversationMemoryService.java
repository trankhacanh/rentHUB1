package com.renthub.ai.conversation.application;

import com.renthub.ai.conversation.entity.AiConversation;
import com.renthub.ai.conversation.entity.AiConversationMessage;
import com.renthub.ai.conversation.repository.AiConversationMessageRepository;
import com.renthub.ai.conversation.repository.AiConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.renthub.ai.dto.AiConversationHistoryResponse;
import com.renthub.ai.dto.AiConversationMessageResponse;
import com.renthub.ai.dto.AiConversationSummaryResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiConversationMemoryService {

        private final AiConversationRepository conversationRepository;
        private final AiConversationMessageRepository messageRepository;

        /**
         * Load tối đa 10 tin nhắn gần nhất của đúng người dùng.
         * Repository trả về mới nhất trước, service đảo lại thành cũ nhất trước.
         */
        @Transactional(readOnly = true)
        public List<AiChatMessage> loadRecentMessages(
                        UUID conversationId,
                        UUID userId) {
                requireIds(conversationId, userId);

                if (conversationRepository
                                .findByIdAndUserId(conversationId, userId)
                                .isEmpty()) {

                        if (conversationRepository.existsById(conversationId)) {
                                throw new AccessDeniedException(
                                                "You do not own this AI conversation.");
                        }

                        return List.of();
                }

                List<AiConversationMessage> recent = messageRepository
                                .findTop10ByConversationIdOrderByCreatedAtDescIdDesc(
                                                conversationId);

                List<AiConversationMessage> chronological = new ArrayList<>(recent);

                Collections.reverse(chronological);

                return chronological.stream()
                                .map(message -> new AiChatMessage(
                                                message.getMessageRole(),
                                                message.getContent()))
                                .toList();
        }

        /**
         * Chỉ lưu exchange sau khi AI trả lời thành công.
         */
        @Transactional
        public void saveExchange(
                        UUID conversationId,
                        UUID userId,
                        String userContent,
                        String assistantContent) {
                requireIds(conversationId, userId);

                if (!StringUtils.hasText(userContent)
                                || !StringUtils.hasText(assistantContent)) {
                        throw new IllegalArgumentException(
                                        "Both user and assistant messages are required.");
                }

                AiConversation conversation = conversationRepository
                                .findByIdAndUserId(conversationId, userId)
                                .orElseGet(() -> createConversationIfAvailable(conversationId, userId));

                conversation.touch();
                conversationRepository.save(conversation);

                messageRepository.saveAll(List.of(
                                new AiConversationMessage(
                                                conversationId,
                                                "USER",
                                                userContent.trim()),
                                new AiConversationMessage(
                                                conversationId,
                                                "ASSISTANT",
                                                assistantContent.trim())));
        }

        private AiConversation createConversationIfAvailable(
                        UUID conversationId,
                        UUID userId) {
                if (conversationRepository.existsById(conversationId)) {
                        throw new AccessDeniedException(
                                        "You do not own this AI conversation.");
                }

                return new AiConversation(conversationId, userId);
        }

        private void requireIds(UUID conversationId, UUID userId) {
                if (conversationId == null || userId == null) {
                        throw new IllegalArgumentException(
                                        "Conversation ID and authenticated user ID are required.");
                }
        }

        /**
         * Get the latest 50 conversations belonging to the authenticated user.
         */
        @Transactional(readOnly = true)
        public List<AiConversationSummaryResponse> listConversations(
                        UUID userId) {
                if (userId == null) {
                        throw new IllegalArgumentException("User ID is required.");
                }

                return conversationRepository
                                .findTop50ByUserIdOrderByUpdatedAtDesc(userId)
                                .stream()
                                .map(conversation -> {

                                        String title = messageRepository
                                                        .findFirstByConversationIdAndMessageRoleOrderByCreatedAtAscIdAsc(
                                                                        conversation.getId(),
                                                                        "USER")
                                                        .map(AiConversationMessage::getContent)
                                                        .map(content -> createPreview(content, 80))
                                                        .orElse("Cuộc trò chuyện mới");

                                        String lastMessage = messageRepository
                                                        .findFirstByConversationIdOrderByCreatedAtDescIdDesc(
                                                                        conversation.getId())
                                                        .map(AiConversationMessage::getContent)
                                                        .map(content -> createPreview(content, 120))
                                                        .orElse("");

                                        return new AiConversationSummaryResponse(
                                                        conversation.getId(),
                                                        title,
                                                        lastMessage,
                                                        conversation.getUpdatedAt());
                                })
                                .toList();
        }

        /**
         * Load the complete message history of an owned conversation.
         */
        @Transactional(readOnly = true)
        public AiConversationHistoryResponse getConversationHistory(
                        UUID conversationId,
                        UUID userId) {
                requireOwnedConversation(conversationId, userId);

                List<AiConversationMessageResponse> messages = messageRepository
                                .findByConversationIdOrderByCreatedAtAscIdAsc(
                                                conversationId)
                                .stream()
                                .map(message -> new AiConversationMessageResponse(
                                                message.getId(),
                                                message.getMessageRole(),
                                                message.getContent(),
                                                message.getCreatedAt()))
                                .toList();

                return new AiConversationHistoryResponse(
                                conversationId,
                                messages);
        }

        /**
         * Check ownership without exposing another user's conversation.
         */
        private void requireOwnedConversation(
                        UUID conversationId,
                        UUID userId) {
                if (conversationId == null || userId == null) {
                        throw new IllegalArgumentException(
                                        "Conversation ID and user ID are required.");
                }

                conversationRepository
                                .findByIdAndUserId(conversationId, userId)
                                .orElseThrow(() -> new AccessDeniedException(
                                                "Conversation not found or access denied."));
        }

        /**
         * Create a short text preview for the sidebar.
         */
        private String createPreview(
                        String content,
                        int maxLength) {
                if (!StringUtils.hasText(content)) {
                        return "";
                }

                String normalized = content
                                .replaceAll("\\s+", " ")
                                .trim();

                if (normalized.length() <= maxLength) {
                        return normalized;
                }

                return normalized.substring(0, maxLength - 3) + "...";
        }
}