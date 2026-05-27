package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long>, JpaSpecificationExecutor<ProductBatch> {
    
    @Query("SELECT b FROM ProductBatch b JOIN FETCH b.product ORDER BY b.id DESC")
    List<ProductBatch> findAll();
    
    @Query("SELECT b FROM ProductBatch b JOIN FETCH b.product WHERE b.id = :id")
    Optional<ProductBatch> findByIdWithProduct(@Param("id") Long id);
    
    @Query("SELECT b FROM ProductBatch b JOIN FETCH b.product WHERE b.product.id = :productId")
    List<ProductBatch> findByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM ProductBatch b WHERE b.product.id = :productId")
    Integer sumQuantityByProductId(@Param("productId") Long productId);
    
    @Query("SELECT b FROM ProductBatch b JOIN FETCH b.product WHERE b.status = :status")
    List<ProductBatch> findByStatus(@Param("status") ProductBatch.Status status);
    
    @Query("SELECT b FROM ProductBatch b JOIN FETCH b.product WHERE " +
           "b.product.id = :productId AND b.status = :status AND b.quantity > :quantity " +
           "ORDER BY b.expiryDate ASC")
    List<ProductBatch> findByProductIdAndStatusAndQuantityGreaterThanOrderByExpiryDateAsc(
        @Param("productId") Long productId, 
        @Param("status") ProductBatch.Status status, 
        @Param("quantity") Integer quantity);

    @Query("SELECT b FROM ProductBatch b JOIN FETCH b.product WHERE " +
            "(:productId IS NULL OR b.product.id = :productId) AND " +
            "(:status IS NULL OR b.status = :status) " +
            "ORDER BY b.id DESC")
    List<ProductBatch> findFilteredBatches(
            @Param("productId") Long productId,
            @Param("status") ProductBatch.Status status);

    @Query("SELECT b FROM ProductBatch b JOIN FETCH b.product WHERE b.expiryDate < :date AND b.status = :status")
    List<ProductBatch> findByExpiryDateBeforeAndStatus(
            @Param("date") java.time.LocalDate date,
            @Param("status") ProductBatch.Status status);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE ProductBatch b SET b.status = :newStatus WHERE b.expiryDate < :date AND b.status = :oldStatus")
    int updateStatusForExpiredBatches(
            @Param("date") java.time.LocalDate date,
            @Param("oldStatus") ProductBatch.Status oldStatus,
            @Param("newStatus") ProductBatch.Status newStatus);
}
