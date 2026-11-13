
package com.renthub.security.ratelimit;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.exception.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.dao.DataAccessException;


@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(
            RedisRateLimiter rateLimiter,
            ObjectMapper objectMapper
    ) {
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getServletPath();

        return !"/api/auth/signin".equals(path)
                && !"/api/auth/forgot-password".equals(path)
                && !"/api/auth/reset-password".equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getServletPath();
        String bucket;
        int limit;
        Duration window;

        switch (path) {
            case "/api/auth/signin" -> {
                bucket = "signin";
                limit = 5;
                window = Duration.ofMinutes(1);
            }
            case "/api/auth/forgot-password" -> {
                bucket = "forgot-password";
                limit = 3;
                window = Duration.ofMinutes(15);
            }
            case "/api/auth/reset-password" -> {
                bucket = "reset-password";
                limit = 5;
                window = Duration.ofMinutes(15);
            }
            default -> {
                filterChain.doFilter(request, response);
                return;
            }
        }

        String clientKey = request.getRemoteAddr();

        try {
            RedisRateLimiter.RateLimitResult result =
                    rateLimiter.check(bucket, clientKey, limit, window);

            response.setHeader(
                    "X-RateLimit-Limit",
                    String.valueOf(limit)
            );
            response.setHeader(
                    "X-RateLimit-Remaining",
                    String.valueOf(result.remaining())
            );

            if (!result.allowed()) {
                long retryAfterSeconds = Math.max(
                        1,
                        (result.resetAfterMillis() + 999) / 1000
                );

                response.setHeader(
                        "Retry-After",
                        String.valueOf(retryAfterSeconds)
                );

                writeError(
                        response,
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too many requests. Please try again later."
                );
                return;
            }
        } catch (DataAccessException exception) {
    logger.error("Redis rate limiter unavailable.", exception);

    writeError(
            response,
            HttpStatus.SERVICE_UNAVAILABLE,
            "Rate limiting service is temporarily unavailable."
    );
    return;
}

        filterChain.doFilter(request, response);
    }

    private void writeError(
            HttpServletResponse response,
            HttpStatus status,
            String message
    ) throws IOException {

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(
                response.getOutputStream(),
                new ErrorResponse(message, Map.of())
        );
    }
}
