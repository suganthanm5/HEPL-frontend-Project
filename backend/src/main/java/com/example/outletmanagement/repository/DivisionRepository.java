package com.example.outletmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.outletmanagement.entity.Division;
import java.util.Optional;

@Repository
public interface DivisionRepository extends JpaRepository<Division, Long>, JpaSpecificationExecutor<Division> {
    @Query("SELECT DISTINCT d FROM Division d LEFT JOIN FETCH d.products WHERE d.id = :id")
    Optional<Division> findByIdWithProducts(@Param("id") Long id);

    @Query("SELECT DISTINCT d FROM Division d LEFT JOIN FETCH d.products")
    java.util.List<Division> findAllWithProducts();

    Page<Division> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT DISTINCT d FROM Division d LEFT JOIN FETCH d.products WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    java.util.List<Division> findByNameContainingIgnoreCaseWithProducts(@Param("name") String name);

    @Query(value = "SELECT * FROM divisions WHERE LOWER(name) = LOWER(:name)", nativeQuery = true)
    Optional<Division> findByNameIncludingDeleted(@Param("name") String name);
}
