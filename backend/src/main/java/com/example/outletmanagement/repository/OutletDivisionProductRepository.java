package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.OutletDivisionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OutletDivisionProductRepository extends JpaRepository<OutletDivisionProduct, Long> {
}
