package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.Outlet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutletRepository extends JpaRepository<Outlet, Long>, JpaSpecificationExecutor<Outlet> {
    @Query("SELECT DISTINCT o FROM Outlet o LEFT JOIN FETCH o.mappings m LEFT JOIN FETCH m.division LEFT JOIN FETCH m.product WHERE o.id = :id")
    Optional<Outlet> findByIdWithMappings(@Param("id") Long id);

    @Query("SELECT DISTINCT o FROM Outlet o LEFT JOIN FETCH o.mappings m LEFT JOIN FETCH m.division LEFT JOIN FETCH m.product WHERE o.id IN :ids")
    List<Outlet> findAllByIdWithMappings(@Param("ids") List<Long> ids);
    
    Page<Outlet> findByOutletNameContainingIgnoreCase(String outletName, Pageable pageable);
}
