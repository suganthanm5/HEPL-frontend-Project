package com.example.outletmanagement.payload.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class OutletRequest {
    private String outletName;
    private String address;
    private Long locationId;
    private String outletType;
    private String ownerName;
    private List<OutletMappingRequest> mappings;

    @Data
    public static class OutletMappingRequest {
        private Long divisionId;
        private Long productId;
    }
}
