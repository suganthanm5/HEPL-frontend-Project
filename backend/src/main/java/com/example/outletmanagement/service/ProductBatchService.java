package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.ProductBatch;
import java.util.List;

public interface ProductBatchService {
    List<ProductBatch> getAllBatches();
    List<ProductBatch> getFilteredBatches(Long productId, ProductBatch.Status status);
    List<ProductBatch> getBatchesByProduct(Long productId);
    ProductBatch getBatchById(Long id);
    ProductBatch createBatch(com.example.outletmanagement.payload.dto.request.ProductBatchRequest request);
    ProductBatch updateBatch(Long id, com.example.outletmanagement.payload.dto.request.ProductBatchRequest request);
    void deleteBatch(Long id);
}
