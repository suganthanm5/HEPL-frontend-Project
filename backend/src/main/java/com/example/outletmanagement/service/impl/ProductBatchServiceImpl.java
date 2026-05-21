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
    private final com.example.outletmanagement.repository.ProductRepository productRepository;
    private final com.example.outletmanagement.repository.StockTransactionRepository stockTransactionRepository;
    private final com.example.outletmanagement.repository.UserRepository userRepository;

    @Override
    public List<ProductBatch> getAllBatches() {
        return productBatchRepository.findAll();
    }

    @Override
    public org.springframework.data.domain.Page<ProductBatch> getAllBatches(String search, Long productId, ProductBatch.Status status, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<ProductBatch> spec = com.example.outletmanagement.specification.ProductBatchSpecification.searchAndFilter(search, productId, status);
        return productBatchRepository.findAll(spec, pageable);
    }

    @Override
    public List<ProductBatch> getFilteredBatches(Long productId, ProductBatch.Status status) {
        return productBatchRepository.findFilteredBatches(productId, status);
    }

    @Override
    public List<ProductBatch> getBatchesByProduct(Long productId) {
        return productBatchRepository.findByProductId(productId);
    }

    @Override
    public ProductBatch getBatchById(Long id) {
        return productBatchRepository.findByIdWithProduct(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", id));
    }


    @Override
    @Transactional
    public ProductBatch createBatch(com.example.outletmanagement.payload.dto.request.ProductBatchRequest request) {
        com.example.outletmanagement.entity.Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        ProductBatch batch = ProductBatch.builder()
                .product(product)
                .batchNo(request.getBatchNo())
                .manufactureDate(request.getManufactureDate())
                .expiryDate(request.getExpiryDate())
                .quantity(request.getQuantity())
                .purchasePrice(request.getPurchasePrice())
                .sellingPrice(request.getSellingPrice())
                .minimumThreshold(0)
                .status(ProductBatch.Status.ACTIVE)
                .build();

        return productBatchRepository.save(batch);
    }

    @Override
    @Transactional
    public ProductBatch updateBatch(Long id, com.example.outletmanagement.payload.dto.request.ProductBatchRequest request) {
        ProductBatch batch = getBatchById(id);
        batch.setBatchNo(request.getBatchNo());
        batch.setManufactureDate(request.getManufactureDate());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setQuantity(request.getQuantity());
        batch.setPurchasePrice(request.getPurchasePrice());
        batch.setSellingPrice(request.getSellingPrice());
        return productBatchRepository.save(batch);
    }

    @Override
    @Transactional
    public void deleteBatch(Long id) {
        ProductBatch batch = getBatchById(id);
        productBatchRepository.delete(batch);
    }
}
