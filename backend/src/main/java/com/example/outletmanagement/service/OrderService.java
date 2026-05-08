package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.Order;
import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    List<Order> getFilteredOrders(Order.OrderStatus status, Long outletId, String orderNo);
    List<Order> getOrdersByOutlet(Long outletId);
    Order getOrderById(Long id);
    Order createOrder(com.example.outletmanagement.payload.dto.request.OrderRequest request);
    Order updateOrderStatus(Long id, Order.OrderStatus status);
    void deleteOrder(Long id);
}
