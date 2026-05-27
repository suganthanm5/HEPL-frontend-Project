package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.Division;
import com.example.outletmanagement.entity.Product;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class DivisionSpecification {

    public static Specification<Division> searchAndFilter(String keyword, Integer minProducts, Integer maxProducts, Integer daysAgo) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                predicate = cb.and(predicate,
                        cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }

            if (minProducts != null || maxProducts != null) {
                Subquery<Long> sub = query.subquery(Long.class);
                var productRoot = sub.from(Product.class);
                sub.select(cb.count(productRoot))
                   .where(cb.equal(productRoot.get("division"), root));

                if (minProducts != null) {
                    predicate = cb.and(predicate, cb.greaterThanOrEqualTo(sub, minProducts.longValue()));
                }
                if (maxProducts != null) {
                    predicate = cb.and(predicate, cb.lessThanOrEqualTo(sub, maxProducts.longValue()));
                }
            }

            if (daysAgo != null) {
                LocalDateTime startDate = LocalDateTime.now().minusDays(daysAgo);
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            return predicate;
        };
    }
}
