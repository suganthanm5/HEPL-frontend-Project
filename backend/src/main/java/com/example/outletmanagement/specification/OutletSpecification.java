package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.Outlet;
import com.example.outletmanagement.entity.OutletDivisionProduct;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

public class OutletSpecification {
    public static Specification<Outlet> searchAndFilter(String keyword, Long locationId, String type, Long divisionId) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                String likeKeyword = "%" + keyword.toLowerCase() + "%";
                Predicate byName = cb.like(cb.lower(root.get("outletName")), likeKeyword);
                
                // Address could be null, but lower() and like() handles it in standard SQL
                Predicate byCode = root.get("outletCode") != null ? cb.like(cb.lower(root.get("outletCode")), likeKeyword) : cb.or();
                Predicate byOwner = root.get("ownerName") != null ? cb.like(cb.lower(root.get("ownerName")), likeKeyword) : cb.or();
                Predicate byAddress = root.get("address") != null ? cb.like(cb.lower(root.get("address")), likeKeyword) : cb.or();
                
                Join<Object, Object> locationJoin = root.join("location", JoinType.LEFT);
                Predicate byLocation = cb.like(cb.lower(locationJoin.get("name")), likeKeyword);
                
                predicate = cb.and(predicate, cb.or(byName, byCode, byOwner, byAddress, byLocation));
            }

            if (locationId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("location").get("id"), locationId));
            }

            if (type != null && !type.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("outletType"), type));
            }

            if (divisionId != null) {
                Join<Outlet, OutletDivisionProduct> mappingsJoin = root.join("mappings", JoinType.INNER);
                predicate = cb.and(predicate, cb.equal(mappingsJoin.get("division").get("id"), divisionId));
                query.distinct(true);
            }

            return predicate;
        };
    }
}
