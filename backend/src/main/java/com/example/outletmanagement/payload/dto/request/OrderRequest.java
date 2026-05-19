package com.example.outletmanagement.payload.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    @NotNull(message = "Outlet ID is required")
    private Long outletId;

    @NotEmpty(message = "Order items cannot be empty")
    @jakarta.validation.Valid
    private List<OrderItemRequest> items;

    private String remarks;
}
