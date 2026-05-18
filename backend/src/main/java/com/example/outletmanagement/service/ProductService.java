package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.request.ProductRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    Page<ProductResponse> getAllProducts(String search, Long divisionId, BigDecimal minSellingPrice, BigDecimal maxSellingPrice, BigDecimal minPurchasePrice, BigDecimal maxPurchasePrice, Pageable pageable);
    ProductResponse updateProduct(Long id, ProductRequest request);
    ProductResponse getProductById(Long id);
    void deleteProduct(Long id);
    BulkUploadResult bulkCreateProducts(List<ProductRequest> requests);
}
