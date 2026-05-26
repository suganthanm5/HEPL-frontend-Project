package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.ProductRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import com.example.outletmanagement.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping
    public ResponseEntity<ApiResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Product created successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse> bulkCreateProducts(@RequestBody List<ProductRequest> requests) {
        BulkUploadResult result = productService.bulkCreateProducts(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message(result.getSuccessCount() + " product(s) created, " + result.getFailureCount() + " failed")
                .data(result)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    @GetMapping
    public ResponseEntity<ApiResponse> getAllProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) BigDecimal minSellingPrice,
            @RequestParam(required = false) BigDecimal maxSellingPrice,
            @RequestParam(required = false) BigDecimal minPurchasePrice,
            @RequestParam(required = false) BigDecimal maxPurchasePrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String activeSearch = keyword != null ? keyword : search;
        Page<ProductResponse> response = productService.getAllProducts(activeSearch, divisionId, minSellingPrice, maxSellingPrice, minPurchasePrice, maxPurchasePrice, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Products fetched successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getProductById(@PathVariable Long id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Product fetched successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Product updated successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Product deleted successfully")
                .build());
    }
}
