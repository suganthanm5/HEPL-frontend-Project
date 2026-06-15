package com.example.outletmanagement.controller;

import com.example.outletmanagement.entity.StockTransaction;
import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.StockTransferRequest;
import com.example.outletmanagement.payload.dto.response.OutletStockResponse;
import com.example.outletmanagement.payload.dto.response.StockTransactionResponse;
import com.example.outletmanagement.service.OutletStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class OutletStockController {
    private final OutletStockService outletStockService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> getAllStock(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) Long productId,
            @ParameterObject Pageable pageable) {
        String activeSearch = keyword != null ? keyword : search;
        Page<OutletStockResponse> response = outletStockService.getAllStock(activeSearch, outletId, productId, pageable);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Stock fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/outlet/{outletId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> getStockByOutlet(@PathVariable Long outletId, @ParameterObject Pageable pageable) {
        Page<OutletStockResponse> response = outletStockService.getStockByOutlet(outletId, pageable);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Stock fetched successfully")
                .data(response)
                .build());
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<ApiResponse> transferStock(@jakarta.validation.Valid @RequestBody StockTransferRequest request) {
        OutletStockResponse response = outletStockService.transferStock(
                request.getFromOutletId(),
                request.getOutletId(),
                request.getProductId(),
                request.getBatchId(),
                request.getQuantity(),
                request.getRemarks()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Stock transferred successfully")
                .data(response)
                .build());
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> getTransactions(
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockTransaction.TransactionType type,
            @ParameterObject Pageable pageable) {
        Page<StockTransactionResponse> response = outletStockService.getFilteredTransactions(outletId, productId, type, pageable);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Transactions fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/transactions/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<ApiResponse> getTransactionStats(
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) Long productId) {
        java.util.Map<String, Long> stats = outletStockService.getTransactionStats(outletId, productId);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Transaction stats fetched successfully")
                .data(stats)
                .build());
    }
}
