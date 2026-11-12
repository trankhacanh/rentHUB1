
package com.renthub.security.ratelimit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.time.Duration;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    private RedisRateLimiter rateLimiter;
    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        rateLimiter = mock(RedisRateLimiter.class);
        filter = new RateLimitFilter(rateLimiter, new ObjectMapper());
    }

    @Test
    void shouldReturn503WhenRedisIsUnavailable()
            throws ServletException, IOException {

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setServletPath("/api/auth/signin");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();

        when(rateLimiter.check(
                "signin", "127.0.0.1", 5, Duration.ofMinutes(1)))
                .thenThrow(new RedisConnectionFailureException(
                        "Redis unavailable"));

        filter.doFilter(request, response, (req, res) -> {
            throw new AssertionError(
                    "Filter chain must not continue when Redis is unavailable");
        });

        assertEquals(
                HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                response.getStatus());
        assertTrue(response.getContentAsString()
                .contains("temporarily unavailable"));
    }

    @Test
    void shouldReturn429WhenRequestLimitIsExceeded()
            throws ServletException, IOException {

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setServletPath("/api/auth/signin");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();

        when(rateLimiter.check(
                "signin", "127.0.0.1", 5, Duration.ofMinutes(1)))
                .thenReturn(new RedisRateLimiter.RateLimitResult(
                        false, 0, 12_000, 6));

        filter.doFilter(request, response, (req, res) -> {
            throw new AssertionError(
                    "Filter chain must not continue when limit is exceeded");
        });

        assertEquals(
                429,
                response.getStatus());
        assertEquals("12", response.getHeader("Retry-After"));
    }

    @Test
    void shouldContinueFilterChainWhenRequestIsAllowed()
            throws ServletException, IOException {

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setServletPath("/api/auth/signin");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean[] chainCalled = {false};

        when(rateLimiter.check(
                "signin", "127.0.0.1", 5, Duration.ofMinutes(1)))
                .thenReturn(new RedisRateLimiter.RateLimitResult(
                        true, 4, 60_000, 1));

        filter.doFilter(request, response, (req, res) -> {
            chainCalled[0] = true;
        });

        assertTrue(chainCalled[0]);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
        verify(rateLimiter).check(
                "signin", "127.0.0.1", 5, Duration.ofMinutes(1));
    }

    @Test
    void shouldNotApplyRateLimitToEquipmentGet()
            throws ServletException, IOException {

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setServletPath("/api/equipments");

        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean[] chainCalled = {false};

        filter.doFilter(request, response, (req, res) -> {
            chainCalled[0] = true;
        });

        assertTrue(chainCalled[0]);
        verifyNoInteractions(rateLimiter);
    }
}
