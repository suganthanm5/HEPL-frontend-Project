package com.example.outletmanagement.service;

import com.example.outletmanagement.entity.Order;

public interface EmailService {
    void sendOrderNotification(Order order);
    void sendOrderApprovedNotification(Order order);
}
