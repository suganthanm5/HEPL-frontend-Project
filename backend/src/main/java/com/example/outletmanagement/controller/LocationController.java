package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.LocationRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.LocationResponse;
import com.example.outletmanagement.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {
    private final LocationService locationService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping
    public ResponseEntity<ApiResponse> createLocation(@Valid @RequestBody LocationRequest request) {
        LocationResponse response = locationService.createLocation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Location created successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse> bulkCreateLocations(@RequestBody List<LocationRequest> requests) {
        BulkUploadResult result = locationService.bulkCreateLocations(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message(result.getSuccessCount() + " location(s) created, " + result.getFailureCount() + " failed")
                .data(result)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping
    public ResponseEntity<ApiResponse> getAllLocations(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String activeSearch = keyword != null ? keyword : search;
        Page<LocationResponse> response = locationService.getAllLocations(activeSearch, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Locations fetched successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getLocationById(@PathVariable Long id) {
        LocationResponse response = locationService.getLocationById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Location fetched successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateLocation(@PathVariable Long id, @Valid @RequestBody LocationRequest request) {
        LocationResponse response = locationService.updateLocation(id, request);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Location updated successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Location deleted successfully")
                .build());
    }
}
