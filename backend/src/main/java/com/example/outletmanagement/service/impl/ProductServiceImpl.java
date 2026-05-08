package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Division;
import com.example.outletmanagement.entity.Product;
import com.example.outletmanagement.payload.dto.request.ProductRequest;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.service.ProductService;
import com.example.outletmanagement.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final DivisionRepository divisionRepository;

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        Division division = divisionRepository.findById(request.getDivisionId())
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + request.getDivisionId()));

        Product product = Product.builder()
                .name(request.getName())
                .productCode(request.getProductCode())
                .uimPrice(request.getUimPrice())
                .mrp(request.getMrp())
                .sellingPrice(request.getSellingPrice())
                .purchasePrice(request.getPurchasePrice())
                .division(division)
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    @Override
    public Page<ProductResponse> getAllProducts(String search, Long divisionId, BigDecimal minSellingPrice, BigDecimal maxSellingPrice, BigDecimal minPurchasePrice, BigDecimal maxPurchasePrice, Pageable pageable) {
        return productRepository.findAll(ProductSpecification.searchAndFilter(search, divisionId, minSellingPrice, maxSellingPrice, minPurchasePrice, maxPurchasePrice), pageable)
                .map(this::mapToResponse);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setName(request.getName());
        product.setProductCode(request.getProductCode());
        product.setUimPrice(request.getUimPrice());
        product.setMrp(request.getMrp());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());

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
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
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
                .build();
    }
}
