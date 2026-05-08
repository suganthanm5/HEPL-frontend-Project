package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.Order;
import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    List<Order> getOrdersByOutlet(Long outletId);
    Order getOrderById(Long id);
    Order createOrder(Order order);
    Order updateOrderStatus(Long id, Order.OrderStatus status);
    void deleteOrder(Long id);
}
