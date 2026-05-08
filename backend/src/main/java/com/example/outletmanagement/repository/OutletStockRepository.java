package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.OutletStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutletStockRepository extends JpaRepository<OutletStock, Long> {
    List<OutletStock> findByOutletId(Long outletId);
    Optional<OutletStock> findByOutletIdAndProductIdAndBatchId(Long outletId, Long productId, Long batchId);
}
