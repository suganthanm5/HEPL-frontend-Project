package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.Outlet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OutletRepository extends JpaRepository<Outlet, Long>, JpaSpecificationExecutor<Outlet> {
    
}
