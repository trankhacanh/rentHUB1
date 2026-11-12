
package com.renthub.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;

@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private SetOperations<String, String> setOperations;

    private PresenceService presenceService;

    private UUID userId;
    private String sessionId;

    @BeforeEach
    void setUp() {
        presenceService = new PresenceService(redisTemplate);

        userId = UUID.randomUUID();
        sessionId = "websocket-session-1";
    }

    @Test
    void connectShouldReturnOnlineTransition() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(1L);

        long result = presenceService.connect(userId, sessionId);

        assertEquals(1L, result);

        verify(redisTemplate).execute(
                any(RedisScript.class),
                eq(List.of(
                        "renthub:presence:session:" + sessionId,
                        "renthub:presence:user:" + userId + ":sessions",
                        "renthub:presence:user:" + userId + ":status"
                )),
                eq(userId.toString()),
                eq(sessionId),
                eq("90")
        );
    }

    @Test
    void connectShouldReturnZeroWhenThereIsNoTransition() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(0L);

        assertEquals(0L, presenceService.connect(userId, sessionId));
    }

    @Test
    void connectShouldRejectNullUserId() {
        assertThrows(
                IllegalArgumentException.class,
                () -> presenceService.connect(null, sessionId)
        );

        verify(redisTemplate, never()).execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        );
    }

    @Test
    void connectShouldRejectBlankSessionId() {
        assertThrows(
                IllegalArgumentException.class,
                () -> presenceService.connect(userId, " ")
        );

        verify(redisTemplate, never()).execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        );
    }

    @Test
    void heartbeatShouldReturnTrueForRegisteredSession() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(1L);

        assertTrue(presenceService.heartbeat(userId, sessionId));

        verify(redisTemplate).execute(
                any(RedisScript.class),
                eq(List.of(
                        "renthub:presence:session:" + sessionId,
                        "renthub:presence:user:" + userId + ":sessions"
                )),
                eq(userId.toString()),
                eq(sessionId),
                eq("90")
        );
    }

    @Test
    void heartbeatShouldReturnFalseWhenSessionIsNotOwnedByUser() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(0L);

        assertFalse(presenceService.heartbeat(userId, sessionId));
    }

    @Test
    void heartbeatShouldRejectInvalidArgumentsWithoutRedisCall() {
        assertFalse(presenceService.heartbeat(null, sessionId));
        assertFalse(presenceService.heartbeat(userId, null));
        assertFalse(presenceService.heartbeat(userId, " "));

        verify(redisTemplate, never()).execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        );
    }

    @Test
    void disconnectShouldReturnOfflineTransition() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(-1L);

        assertEquals(-1L, presenceService.disconnect(userId, sessionId));

        verify(redisTemplate).execute(
                any(RedisScript.class),
                eq(List.of(
                        "renthub:presence:session:" + sessionId,
                        "renthub:presence:user:" + userId + ":sessions",
                        "renthub:presence:user:" + userId + ":status"
                )),
                eq(userId.toString()),
                eq(sessionId)
        );
    }

    @Test
    void disconnectShouldReturnZeroWhenUserRemainsOnline() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(0L);

        assertEquals(0L, presenceService.disconnect(userId, sessionId));
    }

    @Test
    void disconnectShouldReturnZeroForInvalidArguments() {
        assertEquals(0L, presenceService.disconnect(null, sessionId));
        assertEquals(0L, presenceService.disconnect(userId, null));
        assertEquals(0L, presenceService.disconnect(userId, " "));

        verify(redisTemplate, never()).execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        );
    }

    @Test
    void reconcileShouldReturnOnlineTransition() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(1L);

        assertEquals(1L, presenceService.reconcile(userId));

        verify(redisTemplate).execute(
                any(RedisScript.class),
                eq(List.of(
                        "renthub:presence:user:" + userId + ":sessions",
                        "renthub:presence:user:" + userId + ":status"
                )),
                eq(userId.toString())
        );
    }

    @Test
    void reconcileShouldReturnOfflineTransition() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        )).thenReturn(-1L);

        assertEquals(-1L, presenceService.reconcile(userId));
    }

    @Test
    void reconcileShouldReturnZeroForNullUserId() {
        assertEquals(0L, presenceService.reconcile(null));

        verify(redisTemplate, never()).execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)
        );
    }

    @Test
    void isOnlineShouldReturnTrueWhenStatusIsOnline() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        when(valueOperations.get(
                "renthub:presence:user:" + userId + ":status"
        )).thenReturn("ONLINE");

        assertTrue(presenceService.isOnline(userId));
    }

    @Test
    void isOnlineShouldReturnFalseWhenStatusIsOffline() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        when(valueOperations.get(
                "renthub:presence:user:" + userId + ":status"
        )).thenReturn("OFFLINE");

        assertFalse(presenceService.isOnline(userId));
    }

    @Test
    void isOnlineShouldReturnFalseWhenStatusDoesNotExist() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        when(valueOperations.get(
                "renthub:presence:user:" + userId + ":status"
        )).thenReturn(null);

        assertFalse(presenceService.isOnline(userId));
    }

    @Test
    void isOnlineShouldReturnFalseForNullUserId() {
        assertFalse(presenceService.isOnline(null));

        verify(redisTemplate, never()).opsForValue();
    }

    @Test
    void countActiveSessionsShouldCountOnlySessionsOwnedByUser() {
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        String sessionsKey =
                "renthub:presence:user:" + userId + ":sessions";

        when(setOperations.members(sessionsKey))
                .thenReturn(Set.of(
                        "session-1",
                        "session-2",
                        "session-3"
                ));

        when(valueOperations.get(
                "renthub:presence:session:session-1"
        )).thenReturn(userId.toString());

        when(valueOperations.get(
                "renthub:presence:session:session-2"
        )).thenReturn(null);

        when(valueOperations.get(
                "renthub:presence:session:session-3"
        )).thenReturn(UUID.randomUUID().toString());

        assertEquals(1, presenceService.countActiveSessions(userId));
    }

    @Test
    void countActiveSessionsShouldReturnZeroWhenSetIsEmpty() {
        when(redisTemplate.opsForSet()).thenReturn(setOperations);

        when(setOperations.members(
                "renthub:presence:user:" + userId + ":sessions"
        )).thenReturn(Set.of());

        assertEquals(0, presenceService.countActiveSessions(userId));
    }

    @Test
    void countActiveSessionsShouldReturnZeroForNullUserId() {
        assertEquals(0, presenceService.countActiveSessions(null));

        verify(redisTemplate, never()).opsForSet();
    }
}
