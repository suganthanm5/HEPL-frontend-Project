package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.OutletStock;
import com.example.outletmanagement.entity.StockTransaction;
import java.util.List;

public interface OutletStockService {
    List<OutletStock> getStockByOutlet(Long outletId);
    List<OutletStock> getAllStock();
    OutletStock transferStock(Long outletId, Long productId, Long batchId, Integer quantity);
    List<StockTransaction> getTransactions(Long outletId, Long productId);
    List<StockTransaction> getFilteredTransactions(Long outletId, Long productId, StockTransaction.TransactionType type);
}
