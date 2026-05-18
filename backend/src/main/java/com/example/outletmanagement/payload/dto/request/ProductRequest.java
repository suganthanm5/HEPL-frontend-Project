package com.example.outletmanagement.payload.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    private String productCode;

    @DecimalMin(value = "0.0", inclusive = true, message = "UIM Price must be greater than or equal to 0")
    private BigDecimal uimPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "MRP must be greater than or equal to 0")
    private BigDecimal mrp;

    @DecimalMin(value = "0.0", inclusive = true, message = "Selling price must be greater than or equal to 0")
    private BigDecimal sellingPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Purchase price must be greater than or equal to 0")
    private BigDecimal purchasePrice;

    private Long divisionId;

    private String image;
}
