package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class AuditLogSpecification {
    public static Specification<AuditLog> search(String keyword) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                String likeKeyword = "%" + keyword.toLowerCase() + "%";
                Predicate byUsername = cb.like(cb.lower(root.get("username")), likeKeyword);
                Predicate byAction = cb.like(cb.lower(root.get("action")), likeKeyword);
                Predicate byDetails = cb.like(cb.lower(root.get("details")), likeKeyword);

                predicate = cb.and(predicate, cb.or(byUsername, byAction, byDetails));
            }

            return predicate;
        };
    }
}
