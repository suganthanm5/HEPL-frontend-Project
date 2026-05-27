package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.payload.dto.request.ProductRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.service.ProductService;
import com.example.outletmanagement.exception.ResourceAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final DivisionRepository divisionRepository;
    private final ProductBatchRepository productBatchRepository;
    private final OutletDivisionProductRepository outletDivisionProductRepository;
    private final OutletStockRepository outletStockRepository;

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        Division division = divisionRepository.findById(request.getDivisionId())
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + request.getDivisionId()));

        if (productRepository.findByNameIgnoreCase(request.getName().trim()).isPresent()) {
            throw new ResourceAlreadyExistsException("Product", "name", request.getName());
        }

        Product product = Product.builder()
                .name(request.getName())
                .productCode(request.getProductCode())
                .uimPrice(request.getUimPrice())
                .mrp(request.getMrp())
                .sellingPrice(request.getSellingPrice())
                .purchasePrice(request.getPurchasePrice())
                .division(division)
                .image(request.getImage())
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    @Override
    public Page<ProductResponse> getAllProducts(String search, Long divisionId, BigDecimal minSellingPrice, BigDecimal maxSellingPrice, BigDecimal minPurchasePrice, BigDecimal maxPurchasePrice, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<Product> spec = 
                com.example.outletmanagement.specification.ProductSpecification.searchAndFilter(
                        search, divisionId, minSellingPrice, maxSellingPrice, minPurchasePrice, maxPurchasePrice);
        Page<Product> products = productRepository.findAll(spec, pageable);
        return products.map(this::mapToResponse);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        java.util.Optional<Product> existingOpt = productRepository.findByNameIgnoreCase(request.getName().trim());
        if (existingOpt.isPresent() && !existingOpt.get().getId().equals(id)) {
            throw new ResourceAlreadyExistsException("Product", "name", request.getName());
        }

        product.setName(request.getName());
        product.setProductCode(request.getProductCode());
        product.setUimPrice(request.getUimPrice());
        product.setMrp(request.getMrp());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setImage(request.getImage());

        if (request.getDivisionId() != null) {
            Division division = divisionRepository.findById(request.getDivisionId())
                    .orElseThrow(() -> new RuntimeException("Division not found with id: " + request.getDivisionId()));
            product.setDivision(division);
        }

        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }

        // 1. Soft-delete related batches
        List<ProductBatch> batches = productBatchRepository.findByProductId(id);
        if (batches != null && !batches.isEmpty()) {
            productBatchRepository.deleteAll(batches);
        }

        // 2. Soft-delete outlet division product mappings
        List<OutletDivisionProduct> mappings = outletDivisionProductRepository.findByProductId(id);
        if (mappings != null && !mappings.isEmpty()) {
            outletDivisionProductRepository.deleteAll(mappings);
        }

        // 3. Soft-delete outlet stocks
        List<OutletStock> stocks = outletStockRepository.findByProductId(id);
        if (stocks != null && !stocks.isEmpty()) {
            outletStockRepository.deleteAll(stocks);
        }

        // 4. Soft-delete the product itself
        productRepository.deleteById(id);
    }

    @Override
    public BulkUploadResult bulkCreateProducts(List<ProductRequest> requests) {
        List<BulkUploadResult.RowResult> results = new ArrayList<>();
        int success = 0, failure = 0;
        for (int i = 0; i < requests.size(); i++) {
            ProductRequest req = requests.get(i);
            try {
                createProduct(req);
                results.add(BulkUploadResult.RowResult.builder()
                        .row(i + 1).name(req.getName()).success(true).build());
                success++;
            } catch (Exception e) {
                results.add(BulkUploadResult.RowResult.builder()
                        .row(i + 1).name(req.getName()).success(false).error(e.getMessage()).build());
                failure++;
            }
        }
        return BulkUploadResult.builder()
                .totalReceived(requests.size())
                .successCount(success)
                .failureCount(failure)
                .results(results)
                .build();
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .productCode(product.getProductCode())
                .uimPrice(product.getUimPrice())
                .mrp(product.getMrp())
                .sellingPrice(product.getSellingPrice())
                .purchasePrice(product.getPurchasePrice())
                .divisionId(product.getDivision() != null ? product.getDivision().getId() : null)
                .divisionName(product.getDivision() != null ? product.getDivision().getName() : null)
                .image(product.getImage())
                .totalStock(productBatchRepository.sumQuantityByProductId(product.getId()))
                .build();
    }
}
