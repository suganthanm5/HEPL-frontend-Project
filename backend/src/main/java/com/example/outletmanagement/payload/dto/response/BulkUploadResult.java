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
public class BulkUploadResult {
    private int totalReceived;
    private int successCount;
    private int failureCount;
    private List<RowResult> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowResult {
        private int row;
        private String name;
        private boolean success;
        private String error;
    }
}
