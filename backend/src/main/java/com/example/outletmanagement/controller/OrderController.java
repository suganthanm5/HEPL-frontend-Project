package com.example.outletmanagement.controller;

import com.example.outletmanagement.entity.Order;
import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.response.OrderResponse;
import com.example.outletmanagement.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> getAllOrders(
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) String orderNo,
            Pageable pageable
    ) {
        Page<OrderResponse> response = orderService.getFilteredOrders(status, outletId, orderNo, pageable)
                .map(OrderResponse::from);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Orders fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/counts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> getOrderCounts(@RequestParam(required = false) Long outletId) {
        java.util.Map<String, Long> counts = orderService.getOrderCounts(outletId);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Order counts fetched successfully")
                .data(counts)
                .build());
    }

    @GetMapping("/outlet/{outletId}")
    public ResponseEntity<ApiResponse> getOrdersByOutlet(@PathVariable Long outletId) {
        List<OrderResponse> response = orderService.getOrdersByOutlet(outletId)
                .stream().map(OrderResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Orders fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> getOrderById(@PathVariable Long id) {
        OrderResponse response = OrderResponse.from(orderService.getOrderById(id));
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Order fetched successfully")
                .data(response)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> createOrder(@jakarta.validation.Valid @RequestBody com.example.outletmanagement.payload.dto.request.OrderRequest request) {
        OrderResponse response = OrderResponse.from(orderService.createOrder(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Order created successfully")
                .data(response)
                .build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<ApiResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Order.OrderStatus status) {
        OrderResponse response = OrderResponse.from(orderService.updateOrderStatus(id, status));
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Order status updated successfully")
                .data(response)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Order deleted successfully")
                .build());
    }
}
