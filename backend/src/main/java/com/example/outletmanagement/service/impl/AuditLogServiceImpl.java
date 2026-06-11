package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.AuditLog;
import com.example.outletmanagement.repository.AuditLogRepository;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.specification.AuditLogSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String details) {
        String username = "system";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            username = authentication.getName();
        }
        log(username, action, details);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, String action, String details) {
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action(action)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(auditLog);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getAllLogs(String search, Pageable pageable) {
        return auditLogRepository.findAll(AuditLogSpecification.search(search), pageable);
    }

    @Override
    @Transactional
    public void restore(Long logId) {
        AuditLog log = auditLogRepository.findById(logId)
                .orElseThrow(() -> new com.example.outletmanagement.exception.ResourceNotFoundException("AuditLog", "id", logId));

        String action = log.getAction();
        if (action == null || !action.startsWith("DELETE_")) {
            throw new RuntimeException("Only DELETE actions can be restored");
        }

        String tableName = null;
        switch (action) {
            case "DELETE_USER":
                tableName = "users";
                break;
            case "DELETE_PRODUCT":
                tableName = "products";
                break;
            case "DELETE_BATCH":
                tableName = "product_batches";
                break;
            case "DELETE_OUTLET":
                tableName = "outlets";
                break;
            case "DELETE_ORDER":
                tableName = "orders";
                break;
            case "DELETE_LOCATION":
                tableName = "locations";
                break;
            case "DELETE_DIVISION":
                tableName = "divisions";
                break;
            default:
                throw new RuntimeException("Unsupported restore action: " + action);
        }

        String details = log.getDetails();
        if (details == null) {
            throw new RuntimeException("Audit log details are empty, cannot extract entity ID");
        }

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)\\bid:?\\s*(\\d+)");
        java.util.regex.Matcher matcher = pattern.matcher(details);
        if (!matcher.find()) {
            throw new RuntimeException("Could not extract entity ID from details: " + details);
        }

        Long entityId = Long.parseLong(matcher.group(1));

        // Query the entity first to check status and unique columns
        java.util.Map<String, Object> entity;
        try {
            entity = jdbcTemplate.queryForMap("SELECT * FROM " + tableName + " WHERE id = ?", entityId);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RuntimeException("Record not found in table '" + tableName + "' with ID: " + entityId);
        }

        // Check if it is already active
        Object isDeletedVal = entity.get("is_deleted");
        boolean isDeleted = false; // default if null
        if (isDeletedVal instanceof Boolean) {
            isDeleted = (Boolean) isDeletedVal;
        } else if (isDeletedVal instanceof Number) {
            isDeleted = ((Number) isDeletedVal).intValue() != 0;
        } else if (isDeletedVal != null) {
            isDeleted = Boolean.parseBoolean(isDeletedVal.toString());
        }

        if (!isDeleted) {
            throw new RuntimeException("This record is already active / has already been restored.");
        }

        // Check for collisions in active records
        if ("locations".equals(tableName) || "divisions".equals(tableName) || "products".equals(tableName)) {
            String name = (String) entity.get("name");
            if (name != null) {
                String checkSql = "SELECT COUNT(*) FROM " + tableName + " WHERE name = ? AND (is_deleted = false OR is_deleted IS NULL)";
                Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, name);
                if (count != null && count > 0) {
                    throw new RuntimeException("A record with the name '" + name + "' already exists in active records.");
                }
            }
        } else if ("users".equals(tableName)) {
            String username = (String) entity.get("username");
            String email = (String) entity.get("email");
            if (username != null) {
                String checkUserSql = "SELECT COUNT(*) FROM users WHERE username = ? AND (is_deleted = false OR is_deleted IS NULL)";
                Integer userCount = jdbcTemplate.queryForObject(checkUserSql, Integer.class, username);
                if (userCount != null && userCount > 0) {
                    throw new RuntimeException("An active user with username '" + username + "' already exists.");
                }
            }
            if (email != null) {
                String checkEmailSql = "SELECT COUNT(*) FROM users WHERE email = ? AND (is_deleted = false OR is_deleted IS NULL)";
                Integer emailCount = jdbcTemplate.queryForObject(checkEmailSql, Integer.class, email);
                if (emailCount != null && emailCount > 0) {
                    throw new RuntimeException("An active user with email '" + email + "' already exists.");
                }
            }
        } else if ("outlets".equals(tableName)) {
            String outletCode = (String) entity.get("outlet_code");
            if (outletCode != null) {
                String checkSql = "SELECT COUNT(*) FROM outlets WHERE outlet_code = ? AND (is_deleted = false OR is_deleted IS NULL)";
                Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, outletCode);
                if (count != null && count > 0) {
                    throw new RuntimeException("An active outlet with code '" + outletCode + "' already exists.");
                }
            }
        } else if ("orders".equals(tableName)) {
            String orderNo = (String) entity.get("order_no");
            if (orderNo != null) {
                String checkSql = "SELECT COUNT(*) FROM orders WHERE order_no = ? AND (is_deleted = false OR is_deleted IS NULL)";
                Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, orderNo);
                if (count != null && count > 0) {
                    throw new RuntimeException("An active order with number '" + orderNo + "' already exists.");
                }
            }
        }

        String sql = "UPDATE " + tableName + " SET is_deleted = false WHERE id = ?";
        int updatedRows = jdbcTemplate.update(sql, entityId);

        if (updatedRows == 0) {
            throw new RuntimeException("Failed to restore entity. Entity may not exist in database or was permanently deleted.");
        }

        // Log the successful restore action
        String restoreAction = "RESTORE_" + action.substring(7);
        log(restoreAction, "Restored " + tableName + " ID: " + entityId + " from delete audit log ID: " + logId);
    }
}
