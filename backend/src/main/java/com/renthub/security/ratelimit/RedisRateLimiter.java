
package com.renthub.security.ratelimit;

import java.time.Duration;
import java.util.List;
import java.util.Objects;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
public class RedisRateLimiter {

    private static final String KEY_PREFIX = "renthub:ratelimit:";

    @SuppressWarnings("rawtypes")
    private static final DefaultRedisScript<List> RATE_LIMIT_SCRIPT;

static {
    RATE_LIMIT_SCRIPT = new DefaultRedisScript<>();
    RATE_LIMIT_SCRIPT.setScriptText("""
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
                redis.call('PEXPIRE', KEYS[1], ARGV[1])
            end
            local ttl = redis.call('PTTL', KEYS[1])
            return {current, ttl}
            """);
    RATE_LIMIT_SCRIPT.setResultType(List.class);
}

    private final StringRedisTemplate redisTemplate;

    public RedisRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public RateLimitResult check(
            String bucket,
            String clientKey,
            int limit,
            Duration window
    ) {
        validateArguments(bucket, clientKey, limit, window);

        String redisKey = KEY_PREFIX + bucket + ":" + clientKey;

        List<?> result = redisTemplate.execute(
        RATE_LIMIT_SCRIPT,
        List.of(redisKey),
        String.valueOf(window.toMillis())
);

       if (result == null || result.size() != 2
        || !(result.get(0) instanceof Number countValue)
        || !(result.get(1) instanceof Number ttlValue)) {
    throw new IllegalStateException(
            "Redis returned an invalid rate-limit result."
    );
}

long count = countValue.longValue();
long ttlMillis = ttlValue.longValue();

        return new RateLimitResult(
                count <= limit,
                Math.max(0, limit - count),
                Math.max(0, ttlMillis),
                count
        );
    }

    private void validateArguments(
            String bucket,
            String clientKey,
            int limit,
            Duration window
    ) {
        if (bucket == null || !bucket.matches("[a-zA-Z0-9_-]+")) {
            throw new IllegalArgumentException("Invalid rate-limit bucket.");
        }

        if (clientKey == null || clientKey.isBlank()) {
            throw new IllegalArgumentException("Client key must not be blank.");
        }

        if (limit < 1) {
            throw new IllegalArgumentException("Limit must be at least 1.");
        }

        Objects.requireNonNull(window, "Window must not be null.");

        if (window.isZero() || window.isNegative()
                || window.toMillis() < 1) {
            throw new IllegalArgumentException(
                    "Window must be at least 1 millisecond."
            );
        }
    }

    public record RateLimitResult(
            boolean allowed,
            long remaining,
            long resetAfterMillis,
            long currentCount
    ) {
    }
}
