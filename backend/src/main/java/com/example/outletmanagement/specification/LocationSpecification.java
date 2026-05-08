package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.Location;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class LocationSpecification {

    public static Specification<Location> searchAndFilter(String keyword) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                predicate = cb.and(predicate,
                        cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }

            return predicate;
        };
    }
}
