package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Division;
import com.example.outletmanagement.payload.dto.request.DivisionRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.DivisionResponse;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.service.DivisionService;
import com.example.outletmanagement.specification.DivisionSpecification;
import com.example.outletmanagement.exception.ResourceAlreadyExistsException;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.example.outletmanagement.websocket.WebSocketEventPublisher;

@Service
@RequiredArgsConstructor
public class DivisionServiceImpl implements DivisionService {
    private final DivisionRepository divisionRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final com.example.outletmanagement.service.AuditLogService auditLogService;

    @Override
    @CacheEvict(value = "divisions", allEntries = true)
    public DivisionResponse createDivision(DivisionRequest request) {
        java.util.Optional<Division> existingOpt = divisionRepository.findByNameIncludingDeleted(request.getName());
        if (existingOpt.isPresent()) {
            Division existing = existingOpt.get();
            if (existing.getIsDeleted() != null && existing.getIsDeleted()) {
                existing.setIsDeleted(false);
                Division restored = divisionRepository.save(existing);
                DivisionResponse response = mapToResponse(restored);
                auditLogService.log("RESTORE_DIVISION", "Restored division: " + response.getName() + " (ID: " + response.getId() + ")");
                return response;
            } else {
                throw new ResourceAlreadyExistsException("Division", "name", request.getName());
            }
        }
        
        Division division = Division.builder()
                .name(request.getName())
                .build();
        Division savedDivision = divisionRepository.save(division);
        DivisionResponse response = mapToResponse(savedDivision);
        auditLogService.log("CREATE_DIVISION", "Created division: " + response.getName() + " (ID: " + response.getId() + ")");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "divisions", key = "T(java.util.Objects).hash(#search, #minProducts, #maxProducts, #daysAgo, #pageable.pageNumber, #pageable.pageSize)")
    public Page<DivisionResponse> getAllDivisions(String search, Integer minProducts, Integer maxProducts, Integer daysAgo, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<com.example.outletmanagement.entity.Division> spec = 
                com.example.outletmanagement.specification.DivisionSpecification.searchAndFilter(search, minProducts, maxProducts, daysAgo);
        Page<com.example.outletmanagement.entity.Division> divisions = divisionRepository.findAll(spec, pageable);
        return divisions.map(this::mapToResponse);
    }

    @Override
    @CacheEvict(value = "divisions", allEntries = true)
    public DivisionResponse updateDivision(Long id, DivisionRequest request) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + id));

        java.util.Optional<Division> existingOpt = divisionRepository.findByNameIncludingDeleted(request.getName());
        if (existingOpt.isPresent()) {
            Division existing = existingOpt.get();
            if (!existing.getId().equals(id)) {
                if (existing.getIsDeleted() != null && existing.getIsDeleted()) {
                    throw new RuntimeException("A deleted division with this name already exists. Please restore it by adding it as a new division.");
                } else {
                    throw new ResourceAlreadyExistsException("Division", "name", request.getName());
                }
            }
        }

        division.setName(request.getName());
        Division updatedDivision = divisionRepository.save(division);
        DivisionResponse response = mapToResponse(updatedDivision);
        auditLogService.log("UPDATE_DIVISION", "Updated division: " + response.getName() + " (ID: " + response.getId() + ")");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "divisions", key = "#id")
    public DivisionResponse getDivisionById(Long id) {
        Division division = divisionRepository.findByIdWithProducts(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + id));
        return mapToResponse(division);
    }

    @Override
    @Transactional
    @CacheEvict(value = "divisions", allEntries = true)
    public void deleteDivision(Long id) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + id));
        divisionRepository.deleteById(id);
        auditLogService.log("DELETE_DIVISION", "Deleted division ID: " + id + " (Name: " + division.getName() + ")");

        try {
            webSocketEventPublisher.publishNotification("Division deleted: " + division.getName(), "DIVISION_DELETED");
        } catch (Exception e) {
            // Log warning but do not fail the transaction
        }
    }

    @Override
    @CacheEvict(value = "divisions", allEntries = true)
    public BulkUploadResult bulkCreateDivisions(List<DivisionRequest> requests) {
        List<BulkUploadResult.RowResult> results = new ArrayList<>();
        int success = 0, failure = 0;
        for (int i = 0; i < requests.size(); i++) {
            DivisionRequest req = requests.get(i);
            try {
                createDivision(req);
                results.add(BulkUploadResult.RowResult.builder()
                        .row(i + 1).name(req.getName()).success(true).build());
                success++;
            } catch (Exception e) {
                results.add(BulkUploadResult.RowResult.builder()
                        .row(i + 1).name(req.getName()).success(false).error(e.getMessage()).build());
                failure++;
            }
        }
        BulkUploadResult result = BulkUploadResult.builder()
                .totalReceived(requests.size())
                .successCount(success)
                .failureCount(failure)
                .results(results)
                .build();
        auditLogService.log("BULK_CREATE_DIVISIONS", "Bulk created divisions. Success: " + success + ", Failures: " + failure);
        return result;
    }

    private DivisionResponse mapToResponse(Division division) {
        return DivisionResponse.builder()
                .id(division.getId())
                .name(division.getName())
                .createdAt(division.getCreatedAt())
                .updatedAt(division.getUpdatedAt())
                .createdBy(division.getCreatedBy())
                .updatedBy(division.getUpdatedBy())
                .products(division.getProducts() == null || division.getProducts().isEmpty() ? List.of()
                        : division.getProducts().stream()
                                .filter(p -> p != null)
                                .map(p -> ProductResponse.builder()
                                        .id(p.getId())
                                        .name(p.getName())
                                        .productCode(p.getProductCode())
                                        .uimPrice(p.getUimPrice())
                                        .mrp(p.getMrp())
                                        .sellingPrice(p.getSellingPrice())
                                        .purchasePrice(p.getPurchasePrice())
                                        .divisionId(division.getId())
                                        .divisionName(division.getName())
                                        .build())
                                .collect(Collectors.toList()))
                .build();
    }
}
