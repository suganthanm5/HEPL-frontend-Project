package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByOutletId(Long outletId);
    List<StockTransaction> findByProductId(Long productId);
}
