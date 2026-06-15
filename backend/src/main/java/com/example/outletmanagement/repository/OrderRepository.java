package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByOutletId(Long outletId);
    List<Order> findByStatusIn(List<Order.OrderStatus> statuses);
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(MAX(o.batchNumber), 0) FROM Order o WHERE o.outlet.id = :outletId")
    Integer findMaxBatchNumberByOutletId(@org.springframework.data.repository.query.Param("outletId") Long outletId);
    List<Order> findByStatus(Order.OrderStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:outletId IS NULL OR o.outlet.id = :outletId) AND " +
            "(:orderNo IS NULL OR o.orderNo LIKE %:orderNo%) AND " +
            "(:userId IS NULL OR o.user.id = :userId)")
    org.springframework.data.domain.Page<Order> findFilteredOrders(
            @org.springframework.data.repository.query.Param("status") Order.OrderStatus status,
            @org.springframework.data.repository.query.Param("outletId") Long outletId,
            @org.springframework.data.repository.query.Param("orderNo") String orderNo,
            @org.springframework.data.repository.query.Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(i.quantity * i.price) FROM OrderItem i")
    java.math.BigDecimal calculateTotalRevenue();

    @org.springframework.data.jpa.repository.Query("SELECT SUM(i.quantity * i.price) FROM OrderItem i WHERE i.order.outlet.id = :outletId")
    java.math.BigDecimal calculateTotalRevenueByOutlet(@org.springframework.data.repository.query.Param("outletId") Long outletId);

    long countByStatus(Order.OrderStatus status);
    
    long countByOutletId(Long outletId);

    long countByOutletIdAndStatus(Long outletId, Order.OrderStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT o.status, COUNT(o) FROM Order o WHERE (:outletId IS NULL OR o.outlet.id = :outletId) GROUP BY o.status")
    List<Object[]> getOrderCountsByStatus(@org.springframework.data.repository.query.Param("outletId") Long outletId);
}
