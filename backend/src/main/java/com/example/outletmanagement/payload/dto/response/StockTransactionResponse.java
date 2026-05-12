package com.example.outletmanagement.payload.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long batchId;
    private String batchNo;
    private Long outletId;
    private String outletName;
    private Integer quantity;
    private String transactionType;
    private String referenceNo;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
}
