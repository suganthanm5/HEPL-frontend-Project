package com.example.outletmanagement.payload.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutletStockResponse {
    private Long id;
    private Long outletId;
    private String outletName;
    private Long productId;
    private String productName;
    private Long batchId;
    private String batchNo;
    private Integer availableQty;
    private Integer reservedQty;
}
