package com.example.outletmanagement.repository;

import com.example.outletmanagement.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByOutletId(Long outletId);
    List<Order> findByStatus(Order.OrderStatus status);
}
