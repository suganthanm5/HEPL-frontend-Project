package com.example.outletmanagement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());

        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
            Map<String, Object> dbInfo = new HashMap<>();
            dbInfo.put("active_connections", hikariDataSource.getHikariPoolMXBean().getActiveConnections());
            dbInfo.put("idle_connections", hikariDataSource.getHikariPoolMXBean().getIdleConnections());
            dbInfo.put("total_connections", hikariDataSource.getHikariPoolMXBean().getTotalConnections());
            dbInfo.put("pending_threads", hikariDataSource.getHikariPoolMXBean().getThreadsAwaitingConnection());
            response.put("database", dbInfo);
        }

        return ResponseEntity.ok(response);
    }
}
