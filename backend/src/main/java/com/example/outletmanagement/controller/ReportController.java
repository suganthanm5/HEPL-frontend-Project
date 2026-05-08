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

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final OutletStockRepository outletStockRepository;
    private final ProductBatchRepository productBatchRepository;
    private final OrderRepository orderRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping("/stock-summary")
    public ResponseEntity<ApiResponse> getStockSummary() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalStock", outletStockRepository.findAll().stream().mapToInt(s -> s.getAvailableQty()).sum());
        report.put("lowStockItems",
                outletStockRepository.findAll().stream().filter(s -> s.getAvailableQty() < 10).count());
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Stock summary fetched")
                .data(report)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping("/expiring-batches")
    public ResponseEntity<ApiResponse> getExpiringBatches() {
        LocalDate nextMonth = LocalDate.now().plusMonths(1);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Expiring batches fetched")
                .data(productBatchRepository.findAll().stream()
                        .filter(b -> b.getExpiryDate().isBefore(nextMonth))
                        .toList())
                .build());
    }

    private final com.example.outletmanagement.repository.StockTransactionRepository stockTransactionRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse> getTransactions(
            @RequestParam(required = false) com.example.outletmanagement.entity.StockTransaction.TransactionType type,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long outletId) {
        
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Transactions fetched")
                .data(stockTransactionRepository.findAll().stream()
                        .filter(t -> (type == null || t.getTransactionType() == type))
                        .filter(t -> (productId == null || t.getProduct().getId().equals(productId)))
                        .filter(t -> (outletId == null || (t.getOutlet() != null && t.getOutlet().getId().equals(outletId))))
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .toList())
                .build());
    }
}
