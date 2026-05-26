package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.OutletRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.OutletResponse;
import com.example.outletmanagement.service.OutletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/outlets")
@RequiredArgsConstructor
@Slf4j
public class OutletController {
    private final OutletService outletService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping
    public ResponseEntity<ApiResponse> createOutlet(@Valid @RequestBody OutletRequest request) {
        OutletResponse response = outletService.createOutlet(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Outlet created successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse> bulkCreateOutlets(@RequestBody List<OutletRequest> requests) {
        BulkUploadResult result = outletService.bulkCreateOutlets(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message(result.getSuccessCount() + " outlet(s) created, " + result.getFailureCount() + " failed")
                .data(result)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getOutletById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Outlet fetched successfully")
                .data(outletService.getOutletById(id))
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    @GetMapping
    public ResponseEntity<ApiResponse> getAllOutlets(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) String outletType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String activeSearch = keyword != null ? keyword : search;
        log.info("Fetching outlets - page: {}, size: {}, keyword: {}", page, size, activeSearch);
        Page<OutletResponse> response = outletService.getAllOutlets(activeSearch, locationId, outletType, divisionId, PageRequest.of(page, size));
        log.info("Found {} outlets", response.getTotalElements());
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("All outlets fetched")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateOutlet(@PathVariable Long id, @Valid @RequestBody OutletRequest request) {
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Outlet updated successfully")
                .data(outletService.updateOutlet(id, request))
                .build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteOutlet(@PathVariable Long id) {
        outletService.deleteOutlet(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Outlet deleted successfully")
                .build());
    }
}
