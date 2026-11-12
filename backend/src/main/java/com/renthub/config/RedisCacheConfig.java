package com.renthub.config;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JavaType;
import com.renthub.payload.response.EquipmentResponse;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;


@Configuration
@EnableCaching
public class RedisCacheConfig implements CachingConfigurer {

    private final RedisCacheErrorHandler redisCacheErrorHandler;

    public RedisCacheConfig(
            RedisCacheErrorHandler redisCacheErrorHandler
    ) {
        this.redisCacheErrorHandler = redisCacheErrorHandler;
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return redisCacheErrorHandler;
    }

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory connectionFactory
    ) {
        RedisCacheConfiguration defaultConfig =
                RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(5))
                        .disableCachingNullValues()
                        .computePrefixWith(
                                cacheName -> "renthub:cache:" + cacheName + ":"
                        )
                        .serializeKeysWith(
                                RedisSerializationContext.SerializationPair
                                        .fromSerializer(
                                                new StringRedisSerializer()
                                        )
                        );

        ObjectMapper objectMapper = new ObjectMapper();

        JavaType listType = objectMapper.getTypeFactory()
                .constructCollectionType(
                        List.class,
                        EquipmentResponse.class
                );

        Jackson2JsonRedisSerializer<List<EquipmentResponse>> serializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, listType);

        RedisCacheConfiguration equipmentCacheConfig = defaultConfig
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(serializer)
                );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(
                        Map.of("availableEquipments", equipmentCacheConfig)
                )
                .build();
    }
}