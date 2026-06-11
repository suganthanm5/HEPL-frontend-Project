package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    void log(String action, String details);
    void log(String username, String action, String details);
    Page<AuditLog> getAllLogs(String search, Pageable pageable);
    void restore(Long logId);
}
