package com.example.outletmanagement.payload.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutletResponse {
    private Long id;
    private String outletName;
    private String outletCode;
    private Long locationId;
    private String locationName;
    private String outletType;
    private String ownerName;
    private String address;
    private List<MappingResponse> mappings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MappingResponse {
        private Long divisionId;
        private String divisionName;
        private Long productId;
        private String productName;
        private String productCode;
    }
}
