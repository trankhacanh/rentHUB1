package com.renthub.chat.service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private static final String USER_SESSIONS_PREFIX =
            "renthub:presence:user:";

    private static final String SESSION_PREFIX =
            "renthub:presence:session:";

    private static final Duration SESSION_TTL =
            Duration.ofSeconds(90);
    private static final String STATUS_SUFFIX = ":status";
    private static final String LAST_SEEN_SUFFIX = ":lastSeenAt";
    /*
     * Return values:
     *  1 = transitioned to ONLINE
     *  0 = no state transition
     * -1 = transitioned to OFFLINE
     */

    private static final DefaultRedisScript<Long> CONNECT_SCRIPT =
            new DefaultRedisScript<>("""
                    local sessionKey = KEYS[1]
                    local sessionsKey = KEYS[2]
                    local statusKey = KEYS[3]

                    local userId = ARGV[1]
                    local sessionId = ARGV[2]
                    local ttl = tonumber(ARGV[3])

                    local previousStatus = redis.call('GET', statusKey)
                    local sessions = redis.call('SMEMBERS', sessionsKey)
                    local hasActiveSession = false

                    for _, sid in ipairs(sessions) do
                        local key = 'renthub:presence:session:' .. sid
                        local owner = redis.call('GET', key)

                        if owner then
                            if owner == userId then
                                hasActiveSession = true
                            else
                                redis.call('SREM', sessionsKey, sid)
                            end
                        else
                            redis.call('SREM', sessionsKey, sid)
                        end
                    end

                    local currentOwner = redis.call('GET', sessionKey)

                    if currentOwner and currentOwner ~= userId then
                        return 0
                    end

                    redis.call('SET', sessionKey, userId, 'EX', ttl)
                    redis.call('SADD', sessionsKey, sessionId)
                    redis.call('SET', statusKey, 'ONLINE')

                    if previousStatus ~= 'ONLINE' or not hasActiveSession then
                        return 1
                    end

                    return 0
                    """, Long.class);

    private static final DefaultRedisScript<Long> HEARTBEAT_SCRIPT =
            new DefaultRedisScript<>("""
                    local sessionKey = KEYS[1]
                    local sessionsKey = KEYS[2]

                    local userId = ARGV[1]
                    local sessionId = ARGV[2]
                    local ttl = tonumber(ARGV[3])

                    local owner = redis.call('GET', sessionKey)

                    if owner ~= userId then
                        return 0
                    end

                    redis.call('EXPIRE', sessionKey, ttl)
                    redis.call('SADD', sessionsKey, sessionId)

                    return 1
                    """, Long.class);

    private static final DefaultRedisScript<Long> DISCONNECT_SCRIPT =
        new DefaultRedisScript<>("""
                local sessionKey = KEYS[1]
                local sessionsKey = KEYS[2]
                local statusKey = KEYS[3]
                local lastSeenKey = KEYS[4]

                local userId = ARGV[1]
                local sessionId = ARGV[2]
                local lastSeenAt = ARGV[3]

                local owner = redis.call('GET', sessionKey)

                if owner and owner ~= userId then
                    return 0
                end

                local previousStatus = redis.call('GET', statusKey)

                redis.call('DEL', sessionKey)
                redis.call('SREM', sessionsKey, sessionId)

                local sessions = redis.call('SMEMBERS', sessionsKey)
                local hasActiveSession = false

                for _, sid in ipairs(sessions) do
                    local key = 'renthub:presence:session:' .. sid
                    local sessionOwner = redis.call('GET', key)

                    if sessionOwner == userId then
                        hasActiveSession = true
                    else
                        redis.call('SREM', sessionsKey, sid)
                    end
                end

                if hasActiveSession then
                    redis.call('SET', statusKey, 'ONLINE')
                    return 0
                end

                redis.call('SET', statusKey, 'OFFLINE')

                if previousStatus == 'ONLINE' then
                    redis.call('SET', lastSeenKey, lastSeenAt)
                    return -1
                end

                return 0
                """, Long.class);

    private static final DefaultRedisScript<Long> RECONCILE_SCRIPT =
        new DefaultRedisScript<>("""
                local sessionsKey = KEYS[1]
                local statusKey = KEYS[2]
                local lastSeenKey = KEYS[3]

                local userId = ARGV[1]
                local lastSeenAt = ARGV[2]

                local previousStatus = redis.call('GET', statusKey)
                local sessions = redis.call('SMEMBERS', sessionsKey)
                local hasActiveSession = false

                for _, sid in ipairs(sessions) do
                    local key = 'renthub:presence:session:' .. sid
                    local owner = redis.call('GET', key)

                    if owner == userId then
                        hasActiveSession = true
                    else
                        redis.call('SREM', sessionsKey, sid)
                    end
                end

                if hasActiveSession then
                    redis.call('SET', statusKey, 'ONLINE')

                    if previousStatus ~= 'ONLINE' then
                        return 1
                    end

                    return 0
                end

                redis.call('SET', statusKey, 'OFFLINE')

                if previousStatus == 'ONLINE' then
                    redis.call('SET', lastSeenKey, lastSeenAt)
                    return -1
                end

                return 0
                """, Long.class);

    private final StringRedisTemplate redisTemplate;

    /**
     * Registers a WebSocket session.
     *
     * @return 1 if the user transitioned to ONLINE; otherwise 0.
     */
    public long connect(UUID userId, String sessionId) {
        validate(userId, sessionId);

        Long result = redisTemplate.execute(
                CONNECT_SCRIPT,
                List.of(
                        sessionKey(sessionId),
                        userSessionsKey(userId),
                        statusKey(userId)
                ),
                userId.toString(),
                sessionId,
                String.valueOf(SESSION_TTL.toSeconds())
        );

        return result == null ? 0 : result;
    }

    /**
     * Extends the TTL of a session only if it belongs to the user.
     */
    public boolean heartbeat(UUID userId, String sessionId) {
        if (userId == null || sessionId == null || sessionId.isBlank()) {
            return false;
        }

        Long result = redisTemplate.execute(
                HEARTBEAT_SCRIPT,
                List.of(
                        sessionKey(sessionId),
                        userSessionsKey(userId)
                ),
                userId.toString(),
                sessionId,
                String.valueOf(SESSION_TTL.toSeconds())
        );

        return Long.valueOf(1).equals(result);
    }

    /**
     * Removes a WebSocket session.
     *
     * @return -1 if the user transitioned to OFFLINE; otherwise 0.
     */
    public long disconnect(UUID userId, String sessionId) {
    if (userId == null || sessionId == null || sessionId.isBlank()) {
        return 0;
    }

    Instant lastSeenAt = Instant.now();

    Long result = redisTemplate.execute(
            DISCONNECT_SCRIPT,
            List.of(
                    sessionKey(sessionId),
                    userSessionsKey(userId),
                    statusKey(userId),
                    lastSeenKey(userId)
            ),
            userId.toString(),
            sessionId,
            lastSeenAt.toString()
    );

    return result == null ? 0 : result;
}

    /**
     * Reconciles a user's status against all registered session references.
     *
     * @return 1 if ONLINE, -1 if OFFLINE, or 0 if no transition occurred.
     */
   public long reconcile(UUID userId) {
    if (userId == null) {
        return 0;
    }

    Long result = redisTemplate.execute(
            RECONCILE_SCRIPT,
            List.of(
                    userSessionsKey(userId),
                    statusKey(userId),
                    lastSeenKey(userId)
            ),
            userId.toString(),
            Instant.now().toString()
    );

    return result == null ? 0 : result;
}

    /**
     * Reads the status key. Expired sessions are reconciled by the monitor.
     */
    public boolean isOnline(UUID userId) {
        if (userId == null) {
            return false;
        }

        String status = redisTemplate.opsForValue().get(statusKey(userId));
        return "ONLINE".equals(status);
    }
    public Instant getLastSeenAt(UUID userId) {
    if (userId == null) {
        return null;
    }

    String value = redisTemplate.opsForValue()
            .get(lastSeenKey(userId));

    if (value == null || value.isBlank()) {
        return null;
    }

    try {
        return Instant.parse(value);
    } catch (java.time.format.DateTimeParseException exception) {
        return null;
    }
}

    /**
     * Counts session references that currently point to valid sessions.
     */
    public int countActiveSessions(UUID userId) {
        if (userId == null) {
            return 0;
        }

        var sessions = redisTemplate.opsForSet()
                .members(userSessionsKey(userId));

        if (sessions == null || sessions.isEmpty()) {
            return 0;
        }

        int count = 0;

        for (String sessionId : sessions) {
            String owner = redisTemplate.opsForValue()
                    .get(sessionKey(sessionId));

            if (userId.toString().equals(owner)) {
                count++;
            }
        }

        return count;
    }

    private void validate(UUID userId, String sessionId) {
        if (userId == null || sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException(
                    "User ID and session ID are required"
            );
        }
    }

    private String userSessionsKey(UUID userId) {
        return USER_SESSIONS_PREFIX + userId + ":sessions";
    }

    private String sessionKey(String sessionId) {
        return SESSION_PREFIX + sessionId;
    }

    private String statusKey(UUID userId) {
        return USER_SESSIONS_PREFIX + userId + STATUS_SUFFIX;
    }
    private String lastSeenKey(UUID userId) {
    return USER_SESSIONS_PREFIX + userId + LAST_SEEN_SUFFIX;
}

}