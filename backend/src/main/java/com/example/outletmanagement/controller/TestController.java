package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        log.info("Test ping endpoint called");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "API is working");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/divisions-count")
    public ResponseEntity<ApiResponse> divisionsCount() {
        log.info("Test divisions count endpoint called");
        Map<String, Object> data = new HashMap<>();
        data.put("message", "This is a test endpoint");
        data.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Test endpoint working")
                .data(data)
                .build());
    }

    @GetMapping("/debug")
    public ResponseEntity<ApiResponse> debug() {
        log.info("Debug endpoint called");
        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("javaVersion", System.getProperty("java.version"));
        debugInfo.put("osName", System.getProperty("os.name"));
        debugInfo.put("timestamp", System.currentTimeMillis());
        debugInfo.put("message", "If you see this, the API is responding");
        
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Debug information")
                .data(debugInfo)
                .build());
    }
}
