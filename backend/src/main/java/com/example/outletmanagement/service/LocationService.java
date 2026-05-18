package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.request.LocationRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.LocationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface LocationService {
    LocationResponse createLocation(LocationRequest request);
    Page<LocationResponse> getAllLocations(String search, Pageable pageable);
    LocationResponse updateLocation(Long id, LocationRequest request);
    LocationResponse getLocationById(Long id);
    void deleteLocation(Long id);
    BulkUploadResult bulkCreateLocations(List<LocationRequest> requests);
}
