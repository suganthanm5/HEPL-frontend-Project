package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long>, JpaSpecificationExecutor<Location> {
    Page<Location> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM locations WHERE LOWER(name) = LOWER(:name)", nativeQuery = true)
    java.util.Optional<Location> findByNameIncludingDeleted(@org.springframework.data.repository.query.Param("name") String name);
}
