package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.response.OutletStockResponse;
import com.example.outletmanagement.payload.dto.response.StockTransactionResponse;
import com.example.outletmanagement.entity.StockTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface OutletStockService {
    Page<OutletStockResponse> getStockByOutlet(Long outletId, Pageable pageable);
    Page<OutletStockResponse> getAllStock(String search, Long outletId, Long productId, Pageable pageable);
    OutletStockResponse transferStock(Long fromOutletId, Long toOutletId, Long productId, Long batchId, Integer quantity, String remarks);
    Page<StockTransactionResponse> getTransactions(Long outletId, Long productId, Pageable pageable);
    Page<StockTransactionResponse> getFilteredTransactions(Long outletId, Long productId, StockTransaction.TransactionType type, Pageable pageable);
    java.util.Map<String, Long> getTransactionStats(Long outletId, Long productId);
}
