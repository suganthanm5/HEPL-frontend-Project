package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.exception.ResourceNotFoundException;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final OutletStockRepository outletStockRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final UserRepository userRepository;

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public List<Order> getOrdersByOutlet(Long outletId) {
        return orderRepository.findByOutletId(outletId);
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
    }

    @Override
    @Transactional
    public Order createOrder(Order order) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        order.setUser(currentUser);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setOrderNo("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        for (OrderItem item : order.getItems()) {
            item.setOrder(order);
            // Check outlet stock availability
            OutletStock stock = outletStockRepository.findByOutletIdAndProductIdAndBatchId(
                    order.getOutlet().getId(), item.getProduct().getId(), item.getBatch().getId())
                    .orElseThrow(() -> new RuntimeException("No stock found for product: " + item.getProduct().getName()));
            
            if (stock.getAvailableQty() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + item.getProduct().getName());
            }
        }

        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order updateOrderStatus(Long id, Order.OrderStatus status) {
        Order order = getOrderById(id);
        Order.OrderStatus oldStatus = order.getStatus();

        if (oldStatus == status) return order;

        if (status == Order.OrderStatus.APPROVED && oldStatus == Order.OrderStatus.PENDING) {
            // Logic for approval: reserve stock or just mark as approved
            for (OrderItem item : order.getItems()) {
                OutletStock stock = outletStockRepository.findByOutletIdAndProductIdAndBatchId(
                        order.getOutlet().getId(), item.getProduct().getId(), item.getBatch().getId())
                        .orElseThrow(() -> new RuntimeException("Stock disappeared for product: " + item.getProduct().getName()));
                
                if (stock.getAvailableQty() < item.getQuantity()) {
                    throw new RuntimeException("Stock no longer available for product: " + item.getProduct().getName());
                }
                
                stock.setAvailableQty(stock.getAvailableQty() - item.getQuantity());
                stock.setReservedQty(stock.getReservedQty() + item.getQuantity());
                outletStockRepository.save(stock);
            }
        } else if (status == Order.OrderStatus.COMPLETED && oldStatus == Order.OrderStatus.APPROVED) {
            // Deduct from reserved stock and log transaction
            for (OrderItem item : order.getItems()) {
                OutletStock stock = outletStockRepository.findByOutletIdAndProductIdAndBatchId(
                        order.getOutlet().getId(), item.getProduct().getId(), item.getBatch().getId())
                        .orElseThrow(() -> new RuntimeException("Stock record missing"));
                
                stock.setReservedQty(stock.getReservedQty() - item.getQuantity());
                outletStockRepository.save(stock);

                StockTransaction transaction = StockTransaction.builder()
                        .transactionType(StockTransaction.TransactionType.OUT)
                        .product(item.getProduct())
                        .batch(item.getBatch())
                        .outlet(order.getOutlet())
                        .quantity(item.getQuantity())
                        .referenceId(order.getId())
                        .user(order.getUser())
                        .build();
                stockTransactionRepository.save(transaction);
            }
        } else if (status == Order.OrderStatus.REJECTED && oldStatus == Order.OrderStatus.APPROVED) {
            // Move back from reserved to available
            for (OrderItem item : order.getItems()) {
                OutletStock stock = outletStockRepository.findByOutletIdAndProductIdAndBatchId(
                        order.getOutlet().getId(), item.getProduct().getId(), item.getBatch().getId())
                        .orElseThrow(() -> new RuntimeException("Stock record missing"));
                
                stock.setReservedQty(stock.getReservedQty() - item.getQuantity());
                stock.setAvailableQty(stock.getAvailableQty() + item.getQuantity());
                outletStockRepository.save(stock);
            }
        }

        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Cannot delete order that is not in PENDING status");
        }
        orderRepository.delete(order);
    }
}
