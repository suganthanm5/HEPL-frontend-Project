package com.example.outletmanagement.payload.dto.response;

import com.example.outletmanagement.entity.Order;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderNo;
    private String status;
    private LocalDateTime createdAt;
    private String createdBy;
    private OutletInfo outlet;
    private List<ItemInfo> items;
    private Integer batchNumber;
    private String remarks;
    private String approvedBy;
    private LocalDateTime requestDate;
    private LocalDateTime approvedDate;

    @Data
    @Builder
    public static class OutletInfo {
        private Long id;
        private String outletName;
    }

    @Data
    @Builder
    public static class ItemInfo {
        private Long id;
        private Long productId;
        private String productName;
        private String productCode;
        private Integer quantity;
        private java.math.BigDecimal price;
        private String remarks;
        private String image;
    }

    public static OrderResponse from(Order o) {
        return OrderResponse.builder()
                .id(o.getId())
                .orderNo(o.getOrderNo())
                .status(o.getStatus() != null ? o.getStatus().name() : null)
                .createdAt(o.getCreatedAt())
                .createdBy(o.getUser() != null ? o.getUser().getName() : o.getCreatedBy())
                .batchNumber(o.getBatchNumber())
                .remarks(o.getRemarks())
                .approvedBy(o.getApprovedBy())
                .requestDate(o.getRequestDate())
                .approvedDate(o.getApprovedDate())
                .outlet(o.getOutlet() != null ? OutletInfo.builder()
                        .id(o.getOutlet().getId())
                        .outletName(o.getOutlet().getOutletName())
                        .build() : null)
                .items(o.getItems() != null ? o.getItems().stream().map(item ->
                        ItemInfo.builder()
                                .id(item.getId())
                                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                                .productCode(item.getProduct() != null ? item.getProduct().getProductCode() : null)
                                .quantity(item.getQuantity())
                                .price(item.getPrice())
                                .remarks(item.getRemarks())
                                .image(item.getProduct() != null ? item.getProduct().getImage() : null)
                                .build()
                ).toList() : List.of())
                .build();
    }
}
