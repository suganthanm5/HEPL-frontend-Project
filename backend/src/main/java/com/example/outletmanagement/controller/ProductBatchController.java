package com.example.outletmanagement.controller;

import com.example.outletmanagement.entity.ProductBatch;
import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.service.ProductBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class ProductBatchController {
    private final ProductBatchService productBatchService;

    @GetMapping
    public ResponseEntity<ApiResponse> getAllBatches() {
        List<ProductBatch> response = productBatchService.getAllBatches();
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batches fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse> getBatchesByProduct(@PathVariable Long productId) {
        List<ProductBatch> response = productBatchService.getBatchesByProduct(productId);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batches fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getBatchById(@PathVariable Long id) {
        ProductBatch response = productBatchService.getBatchById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batch fetched successfully")
                .data(response)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse> createBatch(@RequestBody ProductBatch batch) {
        ProductBatch response = productBatchService.createBatch(batch);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Batch created successfully")
                .data(response)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse> updateBatch(@PathVariable Long id, @RequestBody ProductBatch batch) {
        ProductBatch response = productBatchService.updateBatch(id, batch);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batch updated successfully")
                .data(response)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long id) {
        productBatchService.deleteBatch(id);
        return ResponseEntity.noContent().build();
    }
}
