
package com.renthub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.stereotype.Component;

@Component
public class RedisCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log =
            LoggerFactory.getLogger(RedisCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(
            RuntimeException exception,
            Cache cache,
            Object key
    ) {
        log.warn(
                "Cache GET failed. Cache={}, key={}. Falling back to method execution.",
                cache.getName(),
                key,
                exception
        );
    }

    @Override
    public void handleCachePutError(
            RuntimeException exception,
            Cache cache,
            Object key,
            Object value
    ) {
        log.warn(
                "Cache PUT failed. Cache={}, key={}. Returning method result without caching.",
                cache.getName(),
                key,
                exception
        );
    }

    @Override
    public void handleCacheEvictError(
            RuntimeException exception,
            Cache cache,
            Object key
    ) {
        log.error(
                "Cache EVICT failed. Cache={}, key={}. Cache may remain stale.",
                cache.getName(),
                key,
                exception
        );
    }

    @Override
    public void handleCacheClearError(
            RuntimeException exception,
            Cache cache
    ) {
        log.error(
                "Cache CLEAR failed. Cache={}. Cache may remain stale.",
                cache.getName(),
                exception
        );
    }
}
