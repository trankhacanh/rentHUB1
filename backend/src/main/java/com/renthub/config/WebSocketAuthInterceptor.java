package com.renthub.config;

import com.renthub.chat.repository.ConversationParticipantRepository;
import com.renthub.security.jwt.JwtUtils;
import com.renthub.security.services.UserDetailsImpl;
import com.renthub.security.services.UserDetailsServiceImpl;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.messaging.MessageDeliveryException;
import java.util.UUID;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final String AUTH_SESSION_ATTRIBUTE =
            "AUTHENTICATION";

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ConversationParticipantRepository participantRepository;

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {

StompHeaderAccessor accessor =
        MessageHeaderAccessor.getAccessor(
                message,
                StompHeaderAccessor.class
        );

boolean wrappedAccessor = accessor == null;

if (wrappedAccessor) {
    accessor = StompHeaderAccessor.wrap(message);
}
        // ==========================================
        // 1. CONNECT
        // ==========================================

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authorization =
                    accessor.getFirstNativeHeader("Authorization");

            if (!StringUtils.hasText(authorization)
                    || !authorization.startsWith("Bearer ")) {

                throw new IllegalArgumentException(
                        "Missing or invalid Authorization header"
                );
            }

            String jwt = authorization.substring(7);

            if (!jwtUtils.validateJwtToken(jwt)) {

                throw new IllegalArgumentException(
                        "Invalid JWT token"
                );
            }

            String email =
                    jwtUtils.getEmailFromJwtToken(jwt);

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(email);

            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

      accessor.setUser(authentication);

if (accessor.getSessionAttributes() != null) {
    accessor.getSessionAttributes().put(
            AUTH_SESSION_ATTRIBUTE,
            authentication
    );
}

System.out.println(
        "STOMP CONNECT authenticated user: "
                + authentication.getName()
);

System.out.println(
        "STOMP CONNECT session ID: "
                + accessor.getSessionId()
);

// Nếu accessor gắn với message gốc, trả lại message đó.
// Nếu phải tạo accessor mới, tạo message với header đã cập nhật.
if (wrappedAccessor) {
    return MessageBuilder.createMessage(
            message.getPayload(),
            accessor.getMessageHeaders()
    );
}

return message;
        }

        // ==========================================
        // 2. SUBSCRIBE
        // ==========================================

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {

            Authentication authentication =
                    getAuthentication(accessor);

            if (authentication == null) {

                throw new IllegalArgumentException(
                        "WebSocket user is not authenticated"
                );
            }

            String destination =
                    accessor.getDestination();

            if (destination == null) {

                throw new IllegalArgumentException(
                        "Subscription destination is missing"
                );
            }

            UserDetailsImpl userDetails =
                    (UserDetailsImpl)
                            authentication.getPrincipal();

            UUID userId =
                    userDetails.getId();

            // ==========================================
// 2.1 CHAT AND PRESENCE SUBSCRIPTIONS
// ==========================================

String conversationPrefix = "/topic/conversations/";
String presenceSuffix = "/presence";

if (destination.startsWith(conversationPrefix)) {

    boolean presenceSubscription =
            destination.endsWith(presenceSuffix);

    String conversationIdText;

    if (presenceSubscription) {
        conversationIdText = destination.substring(
                conversationPrefix.length(),
                destination.length() - presenceSuffix.length()
        );
    } else {
        conversationIdText = destination.substring(
                conversationPrefix.length()
        );
    }

    UUID conversationId;

    try {
        conversationId = UUID.fromString(conversationIdText);
    } catch (IllegalArgumentException e) {
        throw new IllegalArgumentException(
                "Invalid conversation subscription destination"
        );
    }

    boolean participant =
            participantRepository.existsByConversationIdAndUserId(
                    conversationId,
                    userId
            );

    if (!participant) {
        throw new IllegalArgumentException(
                "User is not a participant of this conversation"
        );
    }

 return message;
}

            // ==========================================
            // 2.2 NOTIFICATION SUBSCRIPTION
            // ==========================================

            String notificationPrefix =
                    "/topic/notifications/";

            if (destination.startsWith(notificationPrefix)) {

                String notificationUserIdText =
                        destination.substring(
                                notificationPrefix.length()
                        );

                UUID notificationUserId;

                try {

                    notificationUserId =
                            UUID.fromString(
                                    notificationUserIdText
                            );

                } catch (IllegalArgumentException e) {

                    throw new IllegalArgumentException(
                            "Invalid notification user ID"
                    );
                }

                // User chỉ được subscribe
                // notification của chính mình
                if (!userId.equals(notificationUserId)) {

                    throw new IllegalArgumentException(
                            "User cannot subscribe to another user's notifications"
                    );
                }

                System.out.println(
                        "========== NOTIFICATION SUBSCRIBE =========="
                );

                System.out.println(
                        "User ID: " + userId
                );

                System.out.println(
                        "Notification destination: "
                                + destination
                );

                System.out.println(
                        "============================================="
                );

                return message;
            }

        // ==========================================
// 2.3 MESSAGE BADGE SUBSCRIPTION
// ==========================================

String messagePrefix = "/topic/messages/";

if (destination.startsWith(messagePrefix)) {
    String messageUserIdText =
            destination.substring(messagePrefix.length());

    UUID messageUserId;

    try {
        messageUserId = UUID.fromString(messageUserIdText);
    } catch (IllegalArgumentException e) {
        throw new IllegalArgumentException(
                "Invalid message user ID"
        );
    }

    // Only allow a user to subscribe to their own message events.
    if (!userId.equals(messageUserId)) {
        throw new IllegalArgumentException(
                "User cannot subscribe to another user's message events"
        );
    }

    System.out.println(
            "========== MESSAGE BADGE SUBSCRIBE =========="
    );
    System.out.println("User ID: " + userId);
    System.out.println("Message destination: " + destination);
    System.out.println(
            "=============================================="
    );

    return message;
}

            // ==========================================
            // 2.3 INVALID SUBSCRIPTION
            // ==========================================

            throw new IllegalArgumentException(
                    "Invalid subscription destination"
            );
        }

        return message;
    }

    // ==========================================
    // GET AUTHENTICATION
    // ==========================================

    private Authentication getAuthentication(
            StompHeaderAccessor accessor
    ) {

        if (accessor.getUser() instanceof Authentication) {

            return (Authentication) accessor.getUser();
        }

        if (accessor.getSessionAttributes() != null) {

            Object authentication =
                    accessor.getSessionAttributes()
                            .get(AUTH_SESSION_ATTRIBUTE);

            if (authentication instanceof Authentication) {

                return (Authentication) authentication;
            }
        }

        return null;
    }

    public static String getAuthSessionAttribute() {

        return AUTH_SESSION_ATTRIBUTE;
    }
}