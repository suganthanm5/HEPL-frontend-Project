package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.DivisionRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.DivisionResponse;
import com.example.outletmanagement.service.DivisionService;
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
@RequestMapping("/api/divisions")
@RequiredArgsConstructor
@Slf4j
public class DivisionController {
    private final DivisionService divisionService;
    
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping
    public ResponseEntity<ApiResponse> createDivision(@Valid @RequestBody DivisionRequest request) {
        DivisionResponse response = divisionService.createDivision(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Division created successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse> bulkCreateDivisions(@RequestBody List<DivisionRequest> requests) {
        BulkUploadResult result = divisionService.bulkCreateDivisions(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message(result.getSuccessCount() + " division(s) created, " + result.getFailureCount() + " failed")
                .data(result)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    @GetMapping
    public ResponseEntity<ApiResponse> getAllDivisions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minProducts,
            @RequestParam(required = false) Integer maxProducts,
            @RequestParam(required = false) Integer daysAgo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String activeSearch = keyword != null ? keyword : search;
        log.info("Fetching divisions - page: {}, size: {}, keyword: {}", page, size, activeSearch);
        Page<DivisionResponse> response = divisionService.getAllDivisions(activeSearch, minProducts, maxProducts, daysAgo, PageRequest.of(page, size));
        log.info("Found {} divisions", response.getTotalElements());
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Divisions fetched successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getDivisionById(@PathVariable Long id) {
        DivisionResponse response = divisionService.getDivisionById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Division fetched successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateDivision(@PathVariable Long id, @Valid @RequestBody DivisionRequest request) {
        DivisionResponse response = divisionService.updateDivision(id, request);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Division updated successfully")
                .data(response)
                .build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteDivision(@PathVariable Long id) {
        divisionService.deleteDivision(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Division deleted successfully")
                .build());
    }
}
