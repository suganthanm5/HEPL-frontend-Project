package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
    List<ProductBatch> findByProductId(Long productId);
    List<ProductBatch> findByStatus(ProductBatch.Status status);
    
    List<ProductBatch> findByProductIdAndStatusAndQuantityGreaterThanOrderByExpiryDateAsc(
        Long productId, ProductBatch.Status status, Integer quantity);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM ProductBatch b WHERE " +
            "(:productId IS NULL OR b.product.id = :productId) AND " +
            "(:status IS NULL OR b.status = :status)")
    List<ProductBatch> findFilteredBatches(
            @org.springframework.data.repository.query.Param("productId") Long productId,
            @org.springframework.data.repository.query.Param("status") ProductBatch.Status status);
}
