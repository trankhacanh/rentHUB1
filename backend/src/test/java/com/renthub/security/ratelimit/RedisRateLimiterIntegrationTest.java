
package com.renthub.security.ratelimit;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RedisRateLimiterIntegrationTest {

    @Autowired
    private RedisRateLimiter rateLimiter;

    @Autowired
    private StringRedisTemplate redisTemplate;

    private String bucket;

    @BeforeEach
    void setUp() {
        bucket = "test-" + UUID.randomUUID().toString().replace("-", "");
    }

    @Test
    void shouldAllowRequestsWithinLimit() {
        var first = rateLimiter.check(
                bucket, "client-1", 3, Duration.ofSeconds(30));

        var second = rateLimiter.check(
                bucket, "client-1", 3, Duration.ofSeconds(30));

        assertTrue(first.allowed());
        assertTrue(second.allowed());
        assertEquals(1, first.currentCount());
        assertEquals(2, second.currentCount());
        assertEquals(2, first.remaining());
        assertEquals(1, second.remaining());
    }

    @Test
    void shouldRejectRequestWhenLimitIsExceeded() {
        rateLimiter.check(bucket, "client-1", 2, Duration.ofSeconds(30));
        rateLimiter.check(bucket, "client-1", 2, Duration.ofSeconds(30));

        var third = rateLimiter.check(
                bucket, "client-1", 2, Duration.ofSeconds(30));

        assertFalse(third.allowed());
        assertEquals(3, third.currentCount());
        assertEquals(0, third.remaining());
    }

    @Test
    void shouldKeepClientsIndependent() {
        rateLimiter.check(bucket, "client-1", 1, Duration.ofSeconds(30));

        var blocked = rateLimiter.check(
                bucket, "client-1", 1, Duration.ofSeconds(30));

        var otherClient = rateLimiter.check(
                bucket, "client-2", 1, Duration.ofSeconds(30));

        assertFalse(blocked.allowed());
        assertTrue(otherClient.allowed());
    }

    @Test
    void shouldSetRedisExpiration() {
        rateLimiter.check(bucket, "client-1", 5, Duration.ofSeconds(30));

        String key = "renthub:ratelimit:" + bucket + ":client-1";
        Long ttl = redisTemplate.getExpire(
                key, java.util.concurrent.TimeUnit.MILLISECONDS);

        assertNotNull(ttl);
        assertTrue(ttl > 0 && ttl <= 30_000);
    }

    @Test
    void shouldRejectInvalidArguments() {
        assertThrows(
                IllegalArgumentException.class,
                () -> rateLimiter.check(
                        "invalid bucket", "client-1",
                        5, Duration.ofSeconds(30)));

        assertThrows(
                IllegalArgumentException.class,
                () -> rateLimiter.check(
                        bucket, "client-1",
                        0, Duration.ofSeconds(30)));

        assertThrows(
                IllegalArgumentException.class,
                () -> rateLimiter.check(
                        bucket, "client-1",
                        5, Duration.ZERO));
    }
}
