package com.example.outletmanagement.controller;

import com.example.outletmanagement.entity.Order;
import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse> getAllOrders() {
        List<Order> response = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Orders fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/outlet/{outletId}")
    public ResponseEntity<ApiResponse> getOrdersByOutlet(@PathVariable Long outletId) {
        List<Order> response = orderService.getOrdersByOutlet(outletId);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Orders fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getOrderById(@PathVariable Long id) {
        Order response = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Order fetched successfully")
                .data(response)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createOrder(@RequestBody Order order) {
        Order response = orderService.createOrder(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Order created successfully")
                .data(response)
                .build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Order.OrderStatus status) {
        Order response = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Order status updated successfully")
                .data(response)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
