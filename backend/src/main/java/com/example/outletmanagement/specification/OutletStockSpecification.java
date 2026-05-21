package com.example.outletmanagement.specification;

import com.example.outletmanagement.entity.OutletStock;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

public class OutletStockSpecification {
    public static Specification<OutletStock> searchAndFilter(String keyword, Long outletId, Long productId) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                String likeKeyword = "%" + keyword.toLowerCase() + "%";
                
                Join<Object, Object> productJoin = root.join("product", JoinType.LEFT);
                Join<Object, Object> outletJoin = root.join("outlet", JoinType.LEFT);
                Join<Object, Object> batchJoin = root.join("batch", JoinType.LEFT);
                
                Predicate byProductName = cb.like(cb.lower(productJoin.get("name")), likeKeyword);
                
                Predicate byProductCode = productJoin.get("productCode") != null ? 
                        cb.like(cb.lower(productJoin.get("productCode")), likeKeyword) : cb.or();
                
                Predicate byOutletName = cb.like(cb.lower(outletJoin.get("outletName")), likeKeyword);
                
                Predicate byOutletCode = outletJoin.get("outletCode") != null ? 
                        cb.like(cb.lower(outletJoin.get("outletCode")), likeKeyword) : cb.or();
                
                Predicate byBatchNo = batchJoin.get("batchNo") != null ? 
                        cb.like(cb.lower(batchJoin.get("batchNo")), likeKeyword) : cb.or();
                
                predicate = cb.and(predicate, cb.or(byProductName, byProductCode, byOutletName, byOutletCode, byBatchNo));
            }

            if (outletId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("outlet").get("id"), outletId));
            }

            if (productId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("product").get("id"), productId));
            }

            return predicate;
        };
    }
}
