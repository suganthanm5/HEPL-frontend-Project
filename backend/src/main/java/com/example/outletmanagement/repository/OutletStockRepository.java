package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.OutletStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutletStockRepository extends JpaRepository<OutletStock, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<OutletStock> {
    org.springframework.data.domain.Page<OutletStock> findByOutletId(Long outletId, org.springframework.data.domain.Pageable pageable);
    Optional<OutletStock> findByOutletIdAndProductIdAndBatchId(Long outletId, Long productId, Long batchId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM OutletStock s WHERE s.availableQty < :threshold")
    long countLowStockItems(int threshold);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(s.availableQty) FROM OutletStock s")
    Long sumTotalStock();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM OutletStock s WHERE s.outlet.id = :outletId AND s.availableQty < :threshold")
    long countLowStockItemsByOutlet(@org.springframework.data.repository.query.Param("outletId") Long outletId, @org.springframework.data.repository.query.Param("threshold") int threshold);

    java.util.List<OutletStock> findByProductId(Long productId);
}
