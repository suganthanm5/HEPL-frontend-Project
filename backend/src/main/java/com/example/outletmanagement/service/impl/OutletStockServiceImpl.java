package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.payload.dto.response.OutletStockResponse;
import com.example.outletmanagement.payload.dto.response.StockTransactionResponse;
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

    private OutletStockResponse toOutletStockResponse(OutletStock stock) {
        return OutletStockResponse.builder()
                .id(stock.getId())
                .outletId(stock.getOutlet().getId())
                .outletName(stock.getOutlet().getOutletName())
                .productId(stock.getProduct().getId())
                .productName(stock.getProduct().getName())
                .batchId(stock.getBatch().getId())
                .batchNo(stock.getBatch().getBatchNo())
                .availableQty(stock.getAvailableQty())
                .reservedQty(stock.getReservedQty())
                .build();
    }

    private StockTransactionResponse toStockTransactionResponse(StockTransaction transaction) {
        return StockTransactionResponse.builder()
                .id(transaction.getId())
                .productId(transaction.getProduct().getId())
                .productName(transaction.getProduct().getName())
                .batchId(transaction.getBatch().getId())
                .batchNo(transaction.getBatch().getBatchNo())
                .outletId(transaction.getOutlet() != null ? transaction.getOutlet().getId() : null)
                .outletName(transaction.getOutlet() != null ? transaction.getOutlet().getOutletName() : null)
                .quantity(transaction.getQuantity())
                .transactionType(transaction.getTransactionType().toString())
                .referenceNo(transaction.getReferenceNo())
                .remarks(transaction.getRemarks())
                .createdBy(transaction.getUser().getUsername())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OutletStockResponse> getStockByOutlet(Long outletId) {
        return outletStockRepository.findByOutletId(outletId).stream()
                .map(this::toOutletStockResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OutletStockResponse> getAllStock() {
        return outletStockRepository.findAll().stream()
                .map(this::toOutletStockResponse)
                .toList();
    }

    @Override
    @Transactional
    public OutletStockResponse transferStock(Long fromOutletId, Long toOutletId, Long productId, Long batchId, Integer quantity, String remarks) {
        Outlet fromOutlet = outletRepository.findById(fromOutletId)
                .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", fromOutletId));
        Outlet toOutlet = outletRepository.findById(toOutletId)
                .orElseThrow(() -> new ResourceNotFoundException("Outlet", "id", toOutletId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        ProductBatch batch = productBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductBatch", "id", batchId));

        OutletStock fromStock = outletStockRepository
                .findByOutletIdAndProductIdAndBatchId(fromOutletId, productId, batchId)
                .orElseThrow(() -> new RuntimeException("No stock found in source outlet for this product/batch"));

        if (fromStock.getAvailableQty() < quantity) {
            throw new RuntimeException("Insufficient stock in source outlet. Available: "
                    + fromStock.getAvailableQty() + ", Required: " + quantity);
        }

        // Deduct from source outlet
        fromStock.setAvailableQty(fromStock.getAvailableQty() - quantity);
        outletStockRepository.save(fromStock);

        // Add to destination outlet
        OutletStock toStock = outletStockRepository
                .findByOutletIdAndProductIdAndBatchId(toOutletId, productId, batchId)
                .orElse(OutletStock.builder()
                        .outlet(toOutlet)
                        .product(product)
                        .batch(batch)
                        .availableQty(0)
                        .reservedQty(0)
                        .build());
        toStock.setAvailableQty(toStock.getAvailableQty() + quantity);
        OutletStock savedToStock = outletStockRepository.save(toStock);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        // OUT from source outlet
        stockTransactionRepository.save(StockTransaction.builder()
                .transactionType(StockTransaction.TransactionType.TRANSFER_OUT)
                .product(product).batch(batch).outlet(fromOutlet)
                .quantity(quantity).user(currentUser)
                .remarks(remarks != null && !remarks.trim().isEmpty() ? 
                    remarks + " (Transfer to outlet: " + toOutlet.getOutletName() + ")" : 
                    "Transfer to outlet: " + toOutlet.getOutletName())
                .build());

        // IN to destination outlet
        stockTransactionRepository.save(StockTransaction.builder()
                .transactionType(StockTransaction.TransactionType.TRANSFER_IN)
                .product(product).batch(batch).outlet(toOutlet)
                .quantity(quantity).user(currentUser)
                .remarks(remarks != null && !remarks.trim().isEmpty() ? 
                    remarks + " (Transfer from outlet: " + fromOutlet.getOutletName() + ")" : 
                    "Transfer from outlet: " + fromOutlet.getOutletName())
                .build());

        return toOutletStockResponse(savedToStock);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockTransactionResponse> getTransactions(Long outletId, Long productId) {
        List<StockTransaction> transactions;
        if (outletId != null) {
            transactions = stockTransactionRepository.findByOutletId(outletId);
        } else if (productId != null) {
            transactions = stockTransactionRepository.findByProductId(productId);
        } else {
            transactions = stockTransactionRepository.findAll();
        }
        return transactions.stream()
                .map(this::toStockTransactionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockTransactionResponse> getFilteredTransactions(Long outletId, Long productId, StockTransaction.TransactionType type) {
        return stockTransactionRepository.findFilteredTransactions(outletId, productId, type).stream()
                .map(this::toStockTransactionResponse)
                .toList();
    }
}
