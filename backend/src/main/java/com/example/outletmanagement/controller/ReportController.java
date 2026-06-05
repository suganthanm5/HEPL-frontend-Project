package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.repository.OutletStockRepository;
import com.example.outletmanagement.repository.ProductBatchRepository;
import com.example.outletmanagement.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.outletmanagement.entity.User;
import com.example.outletmanagement.entity.Order;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final OutletStockRepository outletStockRepository;
    private final ProductBatchRepository productBatchRepository;
    private final OrderRepository orderRepository;
    private final com.example.outletmanagement.repository.UserRepository userRepository;
    private final com.example.outletmanagement.repository.DivisionRepository divisionRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping("/stock-summary")
    public ResponseEntity<ApiResponse> getStockSummary() {
        Map<String, Object> report = new HashMap<>();
        Long totalStock = outletStockRepository.sumTotalStock();
        report.put("totalStock", totalStock != null ? totalStock : 0);
        report.put("lowStockItems", outletStockRepository.countLowStockItems(10));
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Stock summary fetched")
                .data(report)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    @GetMapping("/dashboard-summary")
    public ResponseEntity<ApiResponse> getDashboardSummary() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        Map<String, Object> summary = new HashMap<>();
        Long outletId = (currentUser.getRole() == User.Role.ADMIN || (currentUser.getRole() == User.Role.MANAGER && currentUser.getOutlet() == null)) ? null
                : (currentUser.getOutlet() != null ? currentUser.getOutlet().getId() : -1L);

        // 1. Stats
        summary.put("totalUsers", userRepository.count());

        java.math.BigDecimal revenue;
        if (outletId == null) {
            revenue = orderRepository.calculateTotalRevenue();
            summary.put("totalOrders", orderRepository.count());
            summary.put("pendingOrdersCount", orderRepository.countByStatus(Order.OrderStatus.PENDING));
            summary.put("lowStockCount", outletStockRepository.countLowStockItems(10));
        } else {
            revenue = orderRepository.calculateTotalRevenueByOutlet(outletId);
            summary.put("totalOrders", orderRepository.countByOutletId(outletId));
            summary.put("pendingOrdersCount",
                    orderRepository.countByOutletIdAndStatus(outletId, Order.OrderStatus.PENDING));
            summary.put("lowStockCount", outletStockRepository.countLowStockItemsByOutlet(outletId, 10));
        }

        summary.put("totalRevenue", revenue != null ? revenue : java.math.BigDecimal.ZERO);

        // 2. Division Stats (for Pie Chart)
        java.util.List<com.example.outletmanagement.entity.Division> divisions = divisionRepository.findAll();
        long totalProducts = divisions.stream().mapToLong(d -> d.getProducts() != null ? d.getProducts().size() : 0)
                .sum();

        java.util.List<Map<String, Object>> divisionStats = divisions.stream().map(d -> {
            Map<String, Object> stat = new HashMap<>();
            stat.put("name", d.getName());
            long count = d.getProducts() != null ? d.getProducts().size() : 0;
            stat.put("count", count);
            stat.put("value", totalProducts > 0 ? (count * 100.0 / totalProducts) : 0);
            return stat;
        }).toList();
        summary.put("divisionStats", divisionStats);

        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Dashboard summary fetched")
                .data(summary)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping("/expiring-batches")
    public ResponseEntity<ApiResponse> getExpiringBatches() {
        LocalDate nextMonth = LocalDate.now().plusMonths(1);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Expiring batches fetched")
                .data(productBatchRepository.findByExpiryDateBeforeAndStatus(nextMonth,
                        com.example.outletmanagement.entity.ProductBatch.Status.ACTIVE))
                .build());
    }

    private final com.example.outletmanagement.repository.StockTransactionRepository stockTransactionRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse> getTransactions(
            @RequestParam(required = false) com.example.outletmanagement.entity.StockTransaction.TransactionType type,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long outletId,
            org.springframework.data.domain.Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Transactions fetched")
                .data(stockTransactionRepository.findFilteredTransactions(outletId, productId, type, pageable))
                .build());
    }
}
