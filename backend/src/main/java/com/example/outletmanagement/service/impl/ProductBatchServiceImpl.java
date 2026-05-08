package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.ProductBatch;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.repository.ProductBatchRepository;
import com.example.outletmanagement.service.ProductBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductBatchServiceImpl implements ProductBatchService {
    private final ProductBatchRepository productBatchRepository;

    @Override
    public List<ProductBatch> getAllBatches() {
        return productBatchRepository.findAll();
    }

    @Override
    public List<ProductBatch> getBatchesByProduct(Long productId) {
        return productBatchRepository.findByProductId(productId);
    }

    @Override
    public ProductBatch getBatchById(Long id) {
        return productBatchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", id));
    }

    @Override
    @Transactional
    public ProductBatch createBatch(ProductBatch batch) {
        return productBatchRepository.save(batch);
    }

    @Override
    @Transactional
    public ProductBatch updateBatch(Long id, ProductBatch batchDetails) {
        ProductBatch batch = getBatchById(id);
        batch.setBatchNo(batchDetails.getBatchNo());
        batch.setManufactureDate(batchDetails.getManufactureDate());
        batch.setExpiryDate(batchDetails.getExpiryDate());
        batch.setQuantity(batchDetails.getQuantity());
        batch.setPurchasePrice(batchDetails.getPurchasePrice());
        batch.setSellingPrice(batchDetails.getSellingPrice());
        batch.setStatus(batchDetails.getStatus());
        return productBatchRepository.save(batch);
    }

    @Override
    @Transactional
    public void deleteBatch(Long id) {
        ProductBatch batch = getBatchById(id);
        productBatchRepository.delete(batch);
    }
}
