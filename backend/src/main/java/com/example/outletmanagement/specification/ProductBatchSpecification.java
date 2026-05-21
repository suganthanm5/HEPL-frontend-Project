package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.ProductBatch;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

public class ProductBatchSpecification {

    public static Specification<ProductBatch> searchAndFilter(String keyword, Long productId, ProductBatch.Status status) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                String likePattern = "%" + keyword.toLowerCase() + "%";
                Predicate batchNoPredicate = cb.like(cb.lower(root.get("batchNo")), likePattern);
                Predicate productPredicate = cb.like(cb.lower(root.join("product").get("name")), likePattern);
                predicate = cb.and(predicate, cb.or(batchNoPredicate, productPredicate));
            }

            if (productId != null) {
                predicate = cb.and(predicate, cb.equal(root.join("product").get("id"), productId));
            }

            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }

            return predicate;
        };
    }
}
