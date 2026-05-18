package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.request.OutletRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.OutletResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface OutletService {
    OutletResponse createOutlet(OutletRequest request);
    Page<OutletResponse> getAllOutlets(String search, Long locationId, String type, Long divisionId, Pageable pageable);
    OutletResponse updateOutlet(Long id, OutletRequest request);
    OutletResponse getOutletById(Long id);
    void deleteOutlet(Long id);
    BulkUploadResult bulkCreateOutlets(List<OutletRequest> requests);
}
