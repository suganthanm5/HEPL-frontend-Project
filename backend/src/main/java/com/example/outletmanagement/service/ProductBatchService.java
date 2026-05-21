package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.ProductBatch;
import java.util.List;

public interface ProductBatchService {
    List<ProductBatch> getAllBatches();
    org.springframework.data.domain.Page<ProductBatch> getAllBatches(String search, Long productId, ProductBatch.Status status, org.springframework.data.domain.Pageable pageable);
    List<ProductBatch> getFilteredBatches(Long productId, ProductBatch.Status status);
    List<ProductBatch> getBatchesByProduct(Long productId);
    ProductBatch getBatchById(Long id);
    ProductBatch createBatch(com.example.outletmanagement.payload.dto.request.ProductBatchRequest request);
    ProductBatch updateBatch(Long id, com.example.outletmanagement.payload.dto.request.ProductBatchRequest request);
    void deleteBatch(Long id);
}
