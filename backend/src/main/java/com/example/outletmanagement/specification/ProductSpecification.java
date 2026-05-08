package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class ProductSpecification {

    public static Specification<Product> searchAndFilter(
            String keyword,
            Long divisionId,
            BigDecimal minSellingPrice,
            BigDecimal maxSellingPrice,
            BigDecimal minPurchasePrice,
            BigDecimal maxPurchasePrice) {

        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                Predicate byName = cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%");
                Predicate byCode = cb.like(cb.lower(root.get("productCode")), "%" + keyword.toLowerCase() + "%");
                predicate = cb.and(predicate, cb.or(byName, byCode));
            }

            if (divisionId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("division").get("id"), divisionId));
            }

            if (minSellingPrice != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("sellingPrice"), minSellingPrice));
            }

            if (maxSellingPrice != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("sellingPrice"), maxSellingPrice));
            }

            if (minPurchasePrice != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("purchasePrice"), minPurchasePrice));
            }

            if (maxPurchasePrice != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("purchasePrice"), maxPurchasePrice));
            }

            return predicate;
        };
    }
}
