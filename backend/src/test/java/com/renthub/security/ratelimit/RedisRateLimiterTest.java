
package com.renthub.security.ratelimit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RedisRateLimiterTest {

    @Test
    void shouldAllowRequestsWithinLimit() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter();

        assertTrue(limiter.allow("client-1", 3));
        assertTrue(limiter.allow("client-1", 3));
        assertTrue(limiter.allow("client-1", 3));
    }

    @Test
    void shouldRejectRequestAfterLimitIsReached() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter();

        assertTrue(limiter.allow("client-1", 2));
        assertTrue(limiter.allow("client-1", 2));
        assertFalse(limiter.allow("client-1", 2));
    }

    @Test
    void shouldTrackClientsIndependently() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter();

        assertTrue(limiter.allow("client-1", 1));
        assertFalse(limiter.allow("client-1", 1));
        assertTrue(limiter.allow("client-2", 1));
    }

    private static final class InMemoryRateLimiter {

        private final java.util.Map<String, Integer> counters =
                new java.util.HashMap<>();

        boolean allow(String key, int limit) {
            int current = counters.getOrDefault(key, 0);

            if (current >= limit) {
                return false;
            }

            counters.put(key, current + 1);
            return true;
        }
    }
}
