package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByOutletId(Long outletId);
    List<Order> findByStatus(Order.OrderStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:outletId IS NULL OR o.outlet.id = :outletId) AND " +
            "(:orderNo IS NULL OR o.orderNo LIKE %:orderNo%) AND " +
            "(:userId IS NULL OR o.user.id = :userId)")
    List<Order> findFilteredOrders(
            @org.springframework.data.repository.query.Param("status") Order.OrderStatus status,
            @org.springframework.data.repository.query.Param("outletId") Long outletId,
            @org.springframework.data.repository.query.Param("orderNo") String orderNo,
            @org.springframework.data.repository.query.Param("userId") Long userId);
}
