package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.OutletDivisionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OutletDivisionProductRepository extends JpaRepository<OutletDivisionProduct, Long> {

    @Query("SELECT COUNT(m) > 0 FROM OutletDivisionProduct m WHERE m.outlet.id = :outletId AND m.product.id = :productId")
    boolean existsByOutletIdAndProductId(@Param("outletId") Long outletId, @Param("productId") Long productId);

    java.util.List<OutletDivisionProduct> findByProductId(Long productId);
}
