
package com.renthub.chat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
//import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertNull;
import java.time.Instant;

import java.util.Set;
import java.util.UUID;


import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.reset;

import org.springframework.boot.test.mock.mockito.SpyBean;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class PresenceServiceIntegrationTest {

    private static final String USER_PREFIX =
            "renthub:presence:user:";

    private static final String SESSION_PREFIX =
            "renthub:presence:session:";

    @Autowired
    private PresenceService presenceService;
    @SpyBean
    private PresenceBroadcastService broadcastService;

    @Autowired
    private PresenceExpirationMonitor expirationMonitor;
    @Autowired
    private StringRedisTemplate redisTemplate;

    private UUID userId;
    private String sessionA;
    private String sessionB;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sessionA = "integration-" + UUID.randomUUID();
        sessionB = "integration-" + UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        redisTemplate.delete(SESSION_PREFIX + sessionA);
        redisTemplate.delete(SESSION_PREFIX + sessionB);

        redisTemplate.delete(
                USER_PREFIX + userId + ":sessions"
        );

        redisTemplate.delete(
                USER_PREFIX + userId + ":status"
        );
    }

    @Test
    void firstConnectionShouldTransitionUserOnline() {
        long result = presenceService.connect(userId, sessionA);

        assertEquals(1L, result);
        assertTrue(presenceService.isOnline(userId));
        assertEquals(1, presenceService.countActiveSessions(userId));

        assertEquals(
                userId.toString(),
                redisTemplate.opsForValue().get(
                        SESSION_PREFIX + sessionA
                )
        );
    }

    @Test
    void secondConnectionShouldKeepUserOnline() {
        assertEquals(1L, presenceService.connect(userId, sessionA));

        assertEquals(0L, presenceService.connect(userId, sessionB));

        assertTrue(presenceService.isOnline(userId));
        assertEquals(2, presenceService.countActiveSessions(userId));
    }

    @Test
    void disconnectingOneSessionShouldKeepUserOnline() {
        presenceService.connect(userId, sessionA);
        presenceService.connect(userId, sessionB);

        long result = presenceService.disconnect(userId, sessionA);

        assertEquals(0L, result);
        assertTrue(presenceService.isOnline(userId));
        assertEquals(1, presenceService.countActiveSessions(userId));
    }

    @Test
    void disconnectingLastSessionShouldTransitionUserOffline() {
        presenceService.connect(userId, sessionA);

        long result = presenceService.disconnect(userId, sessionA);

        assertEquals(-1L, result);
        assertFalse(presenceService.isOnline(userId));
        assertEquals(0, presenceService.countActiveSessions(userId));
    }

    @Test
    void heartbeatShouldExtendSessionExpiration() {
        presenceService.connect(userId, sessionA);

        String key = SESSION_PREFIX + sessionA;

        Long ttlBefore = redisTemplate.getExpire(
                key,
                TimeUnit.SECONDS
        );

        assertTrue(ttlBefore != null && ttlBefore > 0);

        assertTrue(presenceService.heartbeat(userId, sessionA));

        Long ttlAfter = redisTemplate.getExpire(
                key,
                TimeUnit.SECONDS
        );

        assertTrue(ttlAfter != null && ttlAfter > 0);
        assertTrue(ttlAfter <= 90);
    }

    @Test
    void heartbeatShouldRejectSessionOwnedByAnotherUser() {
        presenceService.connect(userId, sessionA);

        UUID anotherUser = UUID.randomUUID();

        assertFalse(
                presenceService.heartbeat(anotherUser, sessionA)
        );

        assertEquals(
                userId.toString(),
                redisTemplate.opsForValue().get(
                        SESSION_PREFIX + sessionA
                )
        );
    }

    @Test
    void reconcileShouldTransitionUserOfflineAfterSessionExpires() {
        presenceService.connect(userId, sessionA);

        // Giả lập session hết hạn bằng cách xóa key session.
        redisTemplate.delete(SESSION_PREFIX + sessionA);

        long result = presenceService.reconcile(userId);

        assertEquals(-1L, result);
        assertFalse(presenceService.isOnline(userId));
    }

    @Test
    void reconcileShouldNotRepeatOfflineTransition() {
        presenceService.connect(userId, sessionA);
        presenceService.disconnect(userId, sessionA);

        assertEquals(0L, presenceService.reconcile(userId));
        assertFalse(presenceService.isOnline(userId));
    }

    @Test
    void sessionSetShouldContainRegisteredSessions() {
        presenceService.connect(userId, sessionA);
        presenceService.connect(userId, sessionB);

        Set<String> sessions = redisTemplate.opsForSet().members(
                USER_PREFIX + userId + ":sessions"
        );

        assertTrue(sessions != null);
        assertTrue(sessions.contains(sessionA));
        assertTrue(sessions.contains(sessionB));
    }


@Test
void concurrentConnectionsShouldTransitionOnlineOnlyOnce()
        throws Exception {

    int sessionCount = 20;
    UUID concurrentUserId = UUID.randomUUID();

    List<String> sessionIds = new ArrayList<>();

    for (int i = 0; i < sessionCount; i++) {
        sessionIds.add("concurrent-" + UUID.randomUUID());
    }

    ExecutorService executor =
            Executors.newFixedThreadPool(sessionCount);

    CountDownLatch ready = new CountDownLatch(sessionCount);
    CountDownLatch start = new CountDownLatch(1);

    try {
        List<Future<Long>> futures = new ArrayList<>();

        for (String sessionId : sessionIds) {
            futures.add(executor.submit(() -> {
                ready.countDown();

                if (!start.await(10, TimeUnit.SECONDS)) {
                    throw new IllegalStateException(
                            "Timed out waiting for concurrent start"
                    );
                }

                return presenceService.connect(
                        concurrentUserId,
                        sessionId
                );
            }));
        }

        assertTrue(
                ready.await(10, TimeUnit.SECONDS),
                "All workers should be ready"
        );

        // Cho 20 worker bắt đầu kết nối gần như cùng lúc.
        start.countDown();

        int onlineTransitions = 0;

        for (Future<Long> future : futures) {
            Long result = future.get(15, TimeUnit.SECONDS);

            assertNotNull(result);
            assertTrue(
                    result == 0L || result == 1L,
                    "Unexpected connect result: " + result
            );

            if (result == 1L) {
                onlineTransitions++;
            }
        }

        assertEquals(
                1,
                onlineTransitions,
                "Only one connection should trigger ONLINE transition"
        );

        assertTrue(presenceService.isOnline(concurrentUserId));

        assertEquals(
                sessionCount,
                presenceService.countActiveSessions(concurrentUserId)
        );

    } finally {
        start.countDown();
        executor.shutdownNow();

        // Chỉ xóa dữ liệu thuộc user và session của test này.
        for (String sessionId : sessionIds) {
            redisTemplate.delete(
                    SESSION_PREFIX + sessionId
            );
        }

        redisTemplate.delete(
                USER_PREFIX + concurrentUserId + ":sessions"
        );

        redisTemplate.delete(
                USER_PREFIX + concurrentUserId + ":status"
        );
    }
}



@Test
void concurrentDisconnectsShouldTransitionOfflineOnlyOnce()
        throws Exception {

    int sessionCount = 20;
    UUID concurrentUserId = UUID.randomUUID();

    List<String> sessionIds = new ArrayList<>();

    for (int i = 0; i < sessionCount; i++) {
        sessionIds.add("disconnect-" + UUID.randomUUID());
    }

    ExecutorService executor =
            Executors.newFixedThreadPool(sessionCount);

    CountDownLatch ready = new CountDownLatch(sessionCount);
    CountDownLatch start = new CountDownLatch(1);

    try {
        // Đăng ký toàn bộ session trước khi ngắt đồng thời.
        for (String sessionId : sessionIds) {
            assertTrue(
                    presenceService.connect(
                            concurrentUserId,
                            sessionId
                    ) == 1L
                    || presenceService.isOnline(concurrentUserId)
            );
        }

        assertEquals(
                sessionCount,
                presenceService.countActiveSessions(concurrentUserId)
        );

        List<Future<Long>> futures = new ArrayList<>();

        for (String sessionId : sessionIds) {
            futures.add(executor.submit(() -> {
                ready.countDown();

                if (!start.await(10, TimeUnit.SECONDS)) {
                    throw new IllegalStateException(
                            "Timed out waiting for concurrent start"
                    );
                }

                return presenceService.disconnect(
                        concurrentUserId,
                        sessionId
                );
            }));
        }

        assertTrue(ready.await(10, TimeUnit.SECONDS));

        start.countDown();

        int offlineTransitions = 0;

        for (Future<Long> future : futures) {
            Long result = future.get(15, TimeUnit.SECONDS);

            assertNotNull(result);
            assertTrue(
                    result == -1L || result == 0L,
                    "Unexpected disconnect result: " + result
            );

            if (result == -1L) {
                offlineTransitions++;
            }
        }

        assertEquals(
                1,
                offlineTransitions,
                "Only one disconnect should trigger OFFLINE transition"
        );

        assertFalse(presenceService.isOnline(concurrentUserId));

        assertEquals(
                0,
                presenceService.countActiveSessions(concurrentUserId)
        );

    } finally {
        start.countDown();
        executor.shutdownNow();

        for (String sessionId : sessionIds) {
            redisTemplate.delete(SESSION_PREFIX + sessionId);
        }

        redisTemplate.delete(
                USER_PREFIX + concurrentUserId + ":sessions"
        );

        redisTemplate.delete(
                USER_PREFIX + concurrentUserId + ":status"
        );
    }
}
@Test
void concurrentHeartbeatAndDisconnectShouldNotRestoreSession()
        throws Exception {

    int iterations = 25;

    ExecutorService executor = Executors.newFixedThreadPool(2);

    try {
        for (int i = 0; i < iterations; i++) {
            UUID testUserId = UUID.randomUUID();
            String testSessionId = "heartbeat-race-" + UUID.randomUUID();

            String sessionKey = SESSION_PREFIX + testSessionId;
            String sessionsKey =
                    USER_PREFIX + testUserId + ":sessions";
            String statusKey =
                    USER_PREFIX + testUserId + ":status";

            try {
                // Mỗi vòng lặp bắt đầu với một session ONLINE hợp lệ.
                assertEquals(
                        1L,
                        presenceService.connect(testUserId, testSessionId)
                );

                CountDownLatch ready = new CountDownLatch(2);
                CountDownLatch start = new CountDownLatch(1);

                Future<Boolean> heartbeatFuture = executor.submit(() -> {
                    ready.countDown();

                    if (!start.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException(
                                "Heartbeat timed out waiting to start"
                        );
                    }

                    return presenceService.heartbeat(
                            testUserId,
                            testSessionId
                    );
                });

                Future<Long> disconnectFuture = executor.submit(() -> {
                    ready.countDown();

                    if (!start.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException(
                                "Disconnect timed out waiting to start"
                        );
                    }

                    return presenceService.disconnect(
                            testUserId,
                            testSessionId
                    );
                });

                assertTrue(
                        ready.await(10, TimeUnit.SECONDS),
                        "Both operations should be ready"
                );

                // Hai thao tác bắt đầu gần như đồng thời.
                start.countDown();

                Boolean heartbeatResult =
                        heartbeatFuture.get(10, TimeUnit.SECONDS);

                Long disconnectResult =
                        disconnectFuture.get(10, TimeUnit.SECONDS);

                // Heartbeat có thể chạy trước hoặc sau disconnect.
                // Nếu chạy trước, nó có thể thành công.
                // Nếu chạy sau, nó phải từ chối session đã bị xóa.
                assertNotNull(heartbeatResult);

                // Vì chỉ có một session, disconnect phải chuyển OFFLINE.
                assertEquals(-1L, disconnectResult);

                // Trạng thái cuối cùng phải nhất quán.
                assertFalse(
                        presenceService.isOnline(testUserId),
                        "User must be OFFLINE after disconnect"
                );

                assertEquals(
                        0,
                        presenceService.countActiveSessions(testUserId),
                        "No active sessions should remain"
                );

                assertNull(
                        redisTemplate.opsForValue().get(sessionKey),
                        "Disconnected session must not be restored"
                );

                // Nếu heartbeat chạy sau disconnect, kết quả phải là false.
                // Nếu heartbeat chạy trước disconnect, kết quả có thể là true.
                if (!heartbeatResult) {
                    assertNull(
                            redisTemplate.opsForValue().get(sessionKey),
                            "Rejected heartbeat must not recreate the session"
                    );
                }
            } finally {
                // Chỉ dọn các key do vòng lặp này tạo ra.
                redisTemplate.delete(sessionKey);
                redisTemplate.delete(sessionsKey);
                redisTemplate.delete(statusKey);
            }
        }
    } finally {
        executor.shutdownNow();
    }
}

@Test
void expirationMonitorShouldBroadcastOfflineAfterLastSessionExpires() {
    UUID testUserId = UUID.randomUUID();
    String testSessionId = "monitor-" + UUID.randomUUID();

    String sessionKey = SESSION_PREFIX + testSessionId;
    String sessionsKey = USER_PREFIX + testUserId + ":sessions";
    String statusKey = USER_PREFIX + testUserId + ":status";

    try {
        assertEquals(
                1L,
                presenceService.connect(testUserId, testSessionId)
        );

        assertTrue(presenceService.isOnline(testUserId));

        // Giả lập session đã hết hạn.
        redisTemplate.delete(sessionKey);

        expirationMonitor.detectExpiredSessions();

        assertFalse(presenceService.isOnline(testUserId));

        verify(broadcastService, times(1))
                .broadcastOffline(
                        org.mockito.ArgumentMatchers.eq(testUserId),
                        org.mockito.ArgumentMatchers.any(Instant.class)
                );
    } finally {
        redisTemplate.delete(sessionKey);
        redisTemplate.delete(sessionsKey);
        redisTemplate.delete(statusKey);
        reset(broadcastService);
    }
}

@Test
void expirationMonitorShouldKeepUserOnlineWhenAnotherSessionExists() {
    UUID testUserId = UUID.randomUUID();
    String sessionA = "monitor-" + UUID.randomUUID();
    String sessionB = "monitor-" + UUID.randomUUID();

    String sessionsKey = USER_PREFIX + testUserId + ":sessions";
    String statusKey = USER_PREFIX + testUserId + ":status";

    try {
        assertEquals(1L, presenceService.connect(testUserId, sessionA));
        assertEquals(0L, presenceService.connect(testUserId, sessionB));

        // Giả lập session A hết hạn, session B vẫn còn.
        redisTemplate.delete(SESSION_PREFIX + sessionA);

        expirationMonitor.detectExpiredSessions();

        assertTrue(presenceService.isOnline(testUserId));
        assertEquals(1, presenceService.countActiveSessions(testUserId));

        verifyNoInteractions(broadcastService);
    } finally {
        redisTemplate.delete(SESSION_PREFIX + sessionA);
        redisTemplate.delete(SESSION_PREFIX + sessionB);
        redisTemplate.delete(sessionsKey);
        redisTemplate.delete(statusKey);
        reset(broadcastService);
    }
}


@Test
void expirationMonitorShouldNotBroadcastOfflineRepeatedly() {
    UUID testUserId = UUID.randomUUID();
    String testSessionId = "monitor-" + UUID.randomUUID();

    String sessionKey = SESSION_PREFIX + testSessionId;
    String sessionsKey = USER_PREFIX + testUserId + ":sessions";
    String statusKey = USER_PREFIX + testUserId + ":status";

    try {
        assertEquals(
                1L,
                presenceService.connect(testUserId, testSessionId)
        );

        redisTemplate.delete(sessionKey);

        expirationMonitor.detectExpiredSessions();
        expirationMonitor.detectExpiredSessions();

        verify(broadcastService, times(1))
                .broadcastOffline(
                        org.mockito.ArgumentMatchers.eq(testUserId),
                        org.mockito.ArgumentMatchers.any(Instant.class)
                );
    } finally {
        redisTemplate.delete(sessionKey);
        redisTemplate.delete(sessionsKey);
        redisTemplate.delete(statusKey);
        reset(broadcastService);
    }
}



}
