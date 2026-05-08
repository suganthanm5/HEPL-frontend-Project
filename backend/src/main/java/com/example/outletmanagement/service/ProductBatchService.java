package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.ProductBatch;
import java.util.List;

public interface ProductBatchService {
    List<ProductBatch> getAllBatches();
    List<ProductBatch> getBatchesByProduct(Long productId);
    ProductBatch getBatchById(Long id);
    ProductBatch createBatch(ProductBatch batch);
    ProductBatch updateBatch(Long id, ProductBatch batch);
    void deleteBatch(Long id);
}
