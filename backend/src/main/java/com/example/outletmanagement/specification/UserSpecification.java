package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {
    public static Specification<User> searchAndFilter(String keyword) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                String likeKeyword = "%" + keyword.toLowerCase() + "%";
                Predicate byName = cb.like(cb.lower(root.get("name")), likeKeyword);
                Predicate byUsername = cb.like(cb.lower(root.get("username")), likeKeyword);
                Predicate byEmail = cb.like(cb.lower(root.get("email")), likeKeyword);
                
                Predicate byRole = null;
                try {
                    User.Role roleEnum = User.Role.valueOf(keyword.toUpperCase());
                    byRole = cb.equal(root.get("role"), roleEnum);
                } catch (IllegalArgumentException e) {
                    // Not a valid role
                }

                if (byRole != null) {
                    predicate = cb.and(predicate, cb.or(byName, byUsername, byEmail, byRole));
                } else {
                    predicate = cb.and(predicate, cb.or(byName, byUsername, byEmail));
                }
            }

            return predicate;
        };
    }
}
