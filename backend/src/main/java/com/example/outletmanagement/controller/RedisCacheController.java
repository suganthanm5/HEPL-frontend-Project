package com.example.outletmanagement.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/redis")
public class RedisCacheController {

    private static final Logger log = LoggerFactory.getLogger(RedisCacheController.class);

    @Autowired
    private CacheManager cacheManager;

    @Autowired(required = false)
    private RedisConnectionFactory redisConnectionFactory;

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getRedisStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("provider", "Spring Boot Cache (Redis)");
        
        boolean isConnected = false;
        String errorMessage = null;
        Long keysCount = 0L;

        if (redisConnectionFactory != null) {
            try (RedisConnection connection = redisConnectionFactory.getConnection()) {
                String ping = connection.ping();
                if ("PONG".equals(ping)) {
                    isConnected = true;
                }
            } catch (Exception e) {
                errorMessage = e.getMessage();
                log.warn("Failed to check Redis connection: {}", errorMessage);
            }
        } else {
            errorMessage = "RedisConnectionFactory is not configured/available";
        }

        status.put("connected", isConnected);
        status.put("fallbackActive", !isConnected);
        
        if (errorMessage != null) {
            status.put("error", errorMessage);
        }

        // Active caches managed by Spring Cache
        Collection<String> cacheNames = cacheManager.getCacheNames();
        status.put("activeCaches", cacheNames);

        // Try to count keys if connected
        if (isConnected && redisTemplate != null) {
            try {
                Set<String> keys = redisTemplate.keys("*");
                if (keys != null) {
                    keysCount = (long) keys.size();
                }
            } catch (Exception e) {
                log.warn("Failed to retrieve cached keys from Redis: {}", e.getMessage());
            }
        }
        status.put("keysCount", keysCount);
        status.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(status);
    }

    @PostMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearCache(@RequestParam String cacheName) {
        Map<String, Object> response = new HashMap<>();
        org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
        
        if (cache != null) {
            cache.clear();
            response.put("success", true);
            response.put("message", "Cache '" + cacheName + "' cleared successfully");
        } else {
            response.put("success", false);
            response.put("message", "Cache '" + cacheName + "' not found");
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllCaches() {
        Map<String, Object> response = new HashMap<>();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        
        for (String cacheName : cacheNames) {
            org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        }
        
        response.put("success", true);
        response.put("message", "All active caches cleared successfully");
        response.put("clearedCachesCount", cacheNames.size());
        
        return ResponseEntity.ok(response);
    }
}
