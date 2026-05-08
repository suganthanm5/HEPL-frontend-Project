package com.example.outletmanagement.payload.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    private String name;
    private String productCode;
    private BigDecimal uimPrice;
    private BigDecimal mrp;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private Long divisionId;
}
