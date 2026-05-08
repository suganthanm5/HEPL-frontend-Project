package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByProductId(Long productId);
    List<StockTransaction> findByOutletId(Long outletId);
    List<StockTransaction> findByBatchId(Long batchId);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM StockTransaction t WHERE " +
            "(:outletId IS NULL OR t.outlet.id = :outletId) AND " +
            "(:productId IS NULL OR t.product.id = :productId) AND " +
            "(:type IS NULL OR t.transactionType = :type) " +
            "ORDER BY t.createdAt DESC")
    List<StockTransaction> findFilteredTransactions(
            @org.springframework.data.repository.query.Param("outletId") Long outletId,
            @org.springframework.data.repository.query.Param("productId") Long productId,
            @org.springframework.data.repository.query.Param("type") StockTransaction.TransactionType type);
}
