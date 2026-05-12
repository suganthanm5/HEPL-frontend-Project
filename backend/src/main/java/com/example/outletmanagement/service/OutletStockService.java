package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.response.OutletStockResponse;
import com.example.outletmanagement.payload.dto.response.StockTransactionResponse;
import com.example.outletmanagement.entity.StockTransaction;
import java.util.List;

public interface OutletStockService {
    List<OutletStockResponse> getStockByOutlet(Long outletId);
    List<OutletStockResponse> getAllStock();
    OutletStockResponse transferStock(Long fromOutletId, Long toOutletId, Long productId, Long batchId, Integer quantity, String remarks);
    List<StockTransactionResponse> getTransactions(Long outletId, Long productId);
    List<StockTransactionResponse> getFilteredTransactions(Long outletId, Long productId, StockTransaction.TransactionType type);
}
