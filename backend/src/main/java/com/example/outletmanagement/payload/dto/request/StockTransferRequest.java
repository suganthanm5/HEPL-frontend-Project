package com.example.outletmanagement.payload.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransferRequest {
    @NotNull(message = "From Outlet ID is required")
    private Long fromOutletId;

    @NotNull(message = "To Outlet ID is required")
    private Long outletId;

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Batch ID is required")
    private Long batchId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String remarks;
}
