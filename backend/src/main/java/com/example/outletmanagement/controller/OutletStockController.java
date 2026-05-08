package com.example.outletmanagement.controller;

import com.example.outletmanagement.entity.OutletStock;
import com.example.outletmanagement.entity.StockTransaction;
import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.StockTransferRequest;
import com.example.outletmanagement.service.OutletStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class OutletStockController {
    private final OutletStockService outletStockService;

    @GetMapping
    public ResponseEntity<ApiResponse> getAllStock() {
        List<OutletStock> response = outletStockService.getAllStock();
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Stock fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/outlet/{outletId}")
    public ResponseEntity<ApiResponse> getStockByOutlet(@PathVariable Long outletId) {
        List<OutletStock> response = outletStockService.getStockByOutlet(outletId);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Stock fetched successfully")
                .data(response)
                .build());
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse> transferStock(@RequestBody StockTransferRequest request) {
        OutletStock response = outletStockService.transferStock(
                request.getOutletId(),
                request.getProductId(),
                request.getBatchId(),
                request.getQuantity()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Stock transferred successfully")
                .data(response)
                .build());
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse> getTransactions(
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) Long productId) {
        List<StockTransaction> response = outletStockService.getTransactions(outletId, productId);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Transactions fetched successfully")
                .data(response)
                .build());
    }
}
