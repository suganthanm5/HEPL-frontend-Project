package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.service.OutletStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OutletStockServiceImpl implements OutletStockService {
    private final OutletStockRepository outletStockRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final OutletRepository outletRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final UserRepository userRepository;

    @Override
    public List<OutletStock> getStockByOutlet(Long outletId) {
        return outletStockRepository.findByOutletId(outletId);
    }

    @Override
    public List<OutletStock> getAllStock() {
        return outletStockRepository.findAll();
    }

    @Override
    @Transactional
    public OutletStock transferStock(Long outletId, Long productId, Long batchId, Integer quantity) {
        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", outletId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        ProductBatch batch = productBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", batchId));

        if (batch.getQuantity() < quantity) {
            throw new RuntimeException("Insufficient quantity in batch");
        }

        // Reduce from batch
        batch.setQuantity(batch.getQuantity() - quantity);
        productBatchRepository.save(batch);

        // Add to outlet stock
        OutletStock stock = outletStockRepository.findByOutletIdAndProductIdAndBatchId(outletId, productId, batchId)
                .orElse(OutletStock.builder()
                        .outlet(outlet)
                        .product(product)
                        .batch(batch)
                        .availableQty(0)
                        .reservedQty(0)
                        .build());

        stock.setAvailableQty(stock.getAvailableQty() + quantity);
        OutletStock savedStock = outletStockRepository.save(stock);

        // Log transaction
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        StockTransaction transaction = StockTransaction.builder()
                .transactionType(StockTransaction.TransactionType.TRANSFER)
                .product(product)
                .batch(batch)
                .outlet(outlet)
                .quantity(quantity)
                .user(currentUser)
                .build();
        stockTransactionRepository.save(transaction);

        return savedStock;
    }

    @Override
    public List<StockTransaction> getTransactions(Long outletId, Long productId) {
        if (outletId != null) {
            return stockTransactionRepository.findByOutletId(outletId);
        } else if (productId != null) {
            return stockTransactionRepository.findByProductId(productId);
        }
        return stockTransactionRepository.findAll();
    }

    @Override
    public List<StockTransaction> getFilteredTransactions(Long outletId, Long productId, StockTransaction.TransactionType type) {
        return stockTransactionRepository.findFilteredTransactions(outletId, productId, type);
    }
}
