package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.ProductBatch;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.repository.ProductBatchRepository;
import com.example.outletmanagement.service.ProductBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductBatchServiceImpl implements ProductBatchService {
    private final ProductBatchRepository productBatchRepository;
    private final com.example.outletmanagement.repository.ProductRepository productRepository;
    private final com.example.outletmanagement.repository.StockTransactionRepository stockTransactionRepository;
    private final com.example.outletmanagement.repository.UserRepository userRepository;
    
    @Lazy
    private final com.example.outletmanagement.service.OrderService orderService;
    
    @Lazy
    private final com.example.outletmanagement.repository.OrderRepository orderRepository;

    private final com.example.outletmanagement.service.AuditLogService auditLogService;

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

        ProductBatch savedBatch = productBatchRepository.save(batch);
        auditLogService.log("CREATE_BATCH", "Created product batch: " + savedBatch.getBatchNo() + " (Product ID: " + savedBatch.getProduct().getId() + ", Qty: " + savedBatch.getQuantity() + ")");

        // Auto-allocate to pending or partially approved orders
        List<com.example.outletmanagement.entity.Order> pendingOrders = orderRepository
            .findByStatusIn(java.util.Arrays.asList(com.example.outletmanagement.entity.Order.OrderStatus.PENDING, com.example.outletmanagement.entity.Order.OrderStatus.PARTIALLY_APPROVED));
        
        for (com.example.outletmanagement.entity.Order order : pendingOrders) {
            // Check if this order needs this product
            boolean needsProduct = order.getItems().stream()
                .anyMatch(item -> item.getProduct().getId().equals(request.getProductId()) 
                               && (item.getQuantity() - (item.getFulfilledQuantity() != null ? item.getFulfilledQuantity() : 0)) > 0);
            if (needsProduct) {
                try {
                    orderService.updateOrderStatus(order.getId(), com.example.outletmanagement.entity.Order.OrderStatus.APPROVED);
                } catch (Exception e) {
                    System.err.println("Failed to auto-allocate order " + order.getId() + ": " + e.getMessage());
                }
            }
        }

        return savedBatch;
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
        ProductBatch savedBatch = productBatchRepository.save(batch);
        auditLogService.log("UPDATE_BATCH", "Updated batch ID: " + id + " (Batch No: " + savedBatch.getBatchNo() + ", Qty: " + savedBatch.getQuantity() + ")");
        return savedBatch;
    }

    @Override
    @Transactional
    public void deleteBatch(Long id) {
        ProductBatch batch = getBatchById(id);
        productBatchRepository.delete(batch);
        auditLogService.log("DELETE_BATCH", "Deleted batch ID: " + id + " (Batch No: " + batch.getBatchNo() + ")");
    }
}
