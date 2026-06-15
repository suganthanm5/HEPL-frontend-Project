package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface OrderService {
    Page<Order> getAllOrders(Pageable pageable);
    Page<Order> getFilteredOrders(Order.OrderStatus status, Long outletId, String orderNo, Pageable pageable);
    List<Order> getOrdersByOutlet(Long outletId);
    Order getOrderById(Long id);
    Order createOrder(com.example.outletmanagement.payload.dto.request.OrderRequest request);
    Order updateOrderStatus(Long id, Order.OrderStatus status);
    void deleteOrder(Long id);
    java.util.Map<String, Long> getOrderCounts(Long outletId);
}
