package com.example.outletmanagement.payload.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductBatchRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotBlank(message = "Batch number is required")
    private String batchNo;

    @NotNull(message = "Manufacture date is required")
    private LocalDate manufactureDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @NotNull(message = "Purchase price is required")
    @Positive(message = "Purchase price must be positive")
    private BigDecimal purchasePrice;

    @NotNull(message = "Selling price is required")
    @Positive(message = "Selling price must be positive")
    private BigDecimal sellingPrice;
}
