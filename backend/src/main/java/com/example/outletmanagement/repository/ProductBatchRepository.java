package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
    List<ProductBatch> findByProductId(Long productId);
    List<ProductBatch> findByStatus(ProductBatch.Status status);
}
