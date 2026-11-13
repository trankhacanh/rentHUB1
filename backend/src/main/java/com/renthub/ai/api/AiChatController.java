package com.renthub.ai.api;

import com.renthub.ai.application.AiChatService;
import com.renthub.ai.dto.AiChatRequest;
import com.renthub.ai.dto.AiChatResponse;
import com.renthub.payload.response.ApiResponse;
import com.renthub.security.services.UserDetailsImpl;

import jakarta.validation.Valid;

import java.time.Instant;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.http.codec.ServerSentEvent;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;

import com.renthub.ai.exception.AiProviderUnavailableException;
import com.renthub.ai.conversation.application.AiConversationMemoryService;
import com.renthub.ai.dto.AiConversationHistoryResponse;
import com.renthub.ai.dto.AiConversationSummaryResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

        private final AiChatService aiChatService;
        private final AiConversationMemoryService conversationMemoryService;

        /**
         * Synchronous AI chat.
         */
        @PostMapping("/chat")
        public ResponseEntity<ApiResponse<AiChatResponse>> chat(
                        @Valid @RequestBody AiChatRequest request,
                        @AuthenticationPrincipal UserDetailsImpl userDetails) {

                UUID userId = requireUserId(userDetails);

                UUID conversationId = resolveConversationId(
                                request.conversationId());

                String answer = aiChatService.reply(
                                request.message(),
                                conversationId,
                                userId);

                AiChatResponse data = new AiChatResponse(
                                answer,
                                Instant.now(),
                                conversationId);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "AI response generated successfully.",
                                                data));
        }

        /**
         * Streaming AI chat.
         *
         * conversationId is returned through the X-Conversation-Id header
         * to avoid adding a metadata event to the existing token stream.
         */
        @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
        public ResponseEntity<Flux<ServerSentEvent<String>>> stream(
                        @Valid @RequestBody AiChatRequest request,
                        @AuthenticationPrincipal UserDetailsImpl userDetails) {

                UUID userId = requireUserId(userDetails);

                UUID conversationId = resolveConversationId(
                                request.conversationId());

                Flux<ServerSentEvent<String>> events = aiChatService.stream(
                                request.message(),
                                conversationId,
                                userId)
                                .map(token -> ServerSentEvent.<String>builder(token)
                                                .event("token")
                                                .build())
                                .concatWithValues(
                                                ServerSentEvent.<String>builder("[DONE]")
                                                                .event("done")
                                                                .build())
                                .onErrorResume(
                                                AiProviderUnavailableException.class,
                                                exception -> Flux.just(
                                                                ServerSentEvent.<String>builder(
                                                                                "AI service is temporarily unavailable.")
                                                                                .event("error")
                                                                                .build()));

                return ResponseEntity.ok()
                                .contentType(MediaType.TEXT_EVENT_STREAM)
                                .header(
                                                "X-Conversation-Id",
                                                conversationId.toString())
                                .header(
                                                HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS,
                                                "X-Conversation-Id")
                                .body(events);
        }

        /**
         * Resolve authenticated user from JWT principal.
         *
         * Never accept userId directly from frontend.
         */
        private UUID requireUserId(UserDetailsImpl userDetails) {

                if (userDetails == null || userDetails.getId() == null) {
                        throw new AuthenticationCredentialsNotFoundException(
                                        "Authentication is required to use RentHub AI.");
                }

                return userDetails.getId();
        }

        /**
         * Create a new conversation when conversationId is absent.
         */
        private UUID resolveConversationId(UUID conversationId) {

                return conversationId != null
                                ? conversationId
                                : UUID.randomUUID();
        }

        @GetMapping("/conversations")
        public ResponseEntity<ApiResponse<List<AiConversationSummaryResponse>>> listConversations(
                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
                UUID userId = requireUserId(userDetails);

                List<AiConversationSummaryResponse> conversations = conversationMemoryService.listConversations(userId);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Conversations retrieved successfully.",
                                                conversations));
        }

        @GetMapping("/conversations/{conversationId}/messages")
        public ResponseEntity<ApiResponse<AiConversationHistoryResponse>> getConversationMessages(
                        @PathVariable UUID conversationId,
                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
                UUID userId = requireUserId(userDetails);

                AiConversationHistoryResponse history = conversationMemoryService.getConversationHistory(
                                conversationId,
                                userId);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Conversation history retrieved successfully.",
                                                history));
        }
}