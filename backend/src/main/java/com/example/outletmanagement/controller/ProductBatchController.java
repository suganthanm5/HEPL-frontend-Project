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

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping
    public ResponseEntity<ApiResponse> getAllBatches(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) ProductBatch.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String activeSearch = keyword != null ? keyword : search;
        org.springframework.data.domain.Page<ProductBatch> batches = productBatchService.getAllBatches(
                activeSearch, productId, status, org.springframework.data.domain.PageRequest.of(page, size));
        
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batches fetched successfully")
                .data(batches)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse> getBatchesByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batches fetched successfully")
                .data(productBatchService.getBatchesByProduct(productId))
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batch fetched successfully")
                .data(productBatchService.getBatchById(id))
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<ApiResponse> createBatch(@jakarta.validation.Valid @RequestBody com.example.outletmanagement.payload.dto.request.ProductBatchRequest batch) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Batch created successfully")
                .data(productBatchService.createBatch(batch))
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<ApiResponse> updateBatch(@PathVariable Long id, @jakarta.validation.Valid @RequestBody com.example.outletmanagement.payload.dto.request.ProductBatchRequest batch) {
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batch updated successfully")
                .data(productBatchService.updateBatch(id, batch))
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteBatch(@PathVariable Long id) {
        productBatchService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Batch deleted successfully")
                .build());
    }
}
