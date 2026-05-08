package com.example.outletmanagement.payload.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "Product code is required")
    private String productCode;

    @NotNull(message = "UIM Price is required")
    @Positive(message = "UIM Price must be positive")
    private BigDecimal uimPrice;

    @NotNull(message = "MRP is required")
    @Positive(message = "MRP must be positive")
    private BigDecimal mrp;

    @NotNull(message = "Selling price is required")
    @Positive(message = "Selling price must be positive")
    private BigDecimal sellingPrice;

    @NotNull(message = "Purchase price is required")
    @Positive(message = "Purchase price must be positive")
    private BigDecimal purchasePrice;

    @NotNull(message = "Division ID is required")
    private Long divisionId;
}
