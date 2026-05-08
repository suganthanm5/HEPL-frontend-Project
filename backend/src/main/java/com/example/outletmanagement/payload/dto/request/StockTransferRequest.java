package com.example.outletmanagement.payload.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransferRequest {
    private Long outletId;
    private Long productId;
    private Long batchId;
    private Integer quantity;
}
