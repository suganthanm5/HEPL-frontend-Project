package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Division;
import com.example.outletmanagement.payload.dto.request.DivisionRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.DivisionResponse;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.service.DivisionService;
import com.example.outletmanagement.specification.DivisionSpecification;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DivisionServiceImpl implements DivisionService {
    private final DivisionRepository divisionRepository;

    @Override
    public DivisionResponse createDivision(DivisionRequest request) {
        java.util.Optional<Division> existingOpt = divisionRepository.findByNameIncludingDeleted(request.getName());
        if (existingOpt.isPresent()) {
            Division existing = existingOpt.get();
            if (existing.getIsDeleted() != null && existing.getIsDeleted()) {
                existing.setIsDeleted(false);
                Division restored = divisionRepository.save(existing);
                return mapToResponse(restored);
            } else {
                throw new RuntimeException("Division with name '" + request.getName() + "' already exists");
            }
        }
        
        Division division = Division.builder()
                .name(request.getName())
                .build();
        Division savedDivision = divisionRepository.save(division);
        return mapToResponse(savedDivision);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DivisionResponse> getAllDivisions(String search, Boolean hasProducts, Pageable pageable) {
        // Fetch all divisions with products (no lazy loading issue)
        List<Division> allWithProducts;
        if (search != null && !search.isBlank()) {
            allWithProducts = divisionRepository.findByNameContainingIgnoreCaseWithProducts(search);
        } else {
            allWithProducts = divisionRepository.findAllWithProducts();
        }

        // Apply pagination manually
        int total = allWithProducts.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<Division> pageContent = start >= total ? List.of() : allWithProducts.subList(start, end);

        List<DivisionResponse> responses = pageContent.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, total);
    }

    @Override
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
                    throw new RuntimeException("Division with name '" + request.getName() + "' already exists");
                }
            }
        }

        division.setName(request.getName());
        Division updatedDivision = divisionRepository.save(division);
        return mapToResponse(updatedDivision);
    }

    @Override
    @Transactional(readOnly = true)
    public DivisionResponse getDivisionById(Long id) {
        Division division = divisionRepository.findByIdWithProducts(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + id));
        return mapToResponse(division);
    }

    @Override
    @Transactional
    public void deleteDivision(Long id) {
        if (!divisionRepository.existsById(id)) {
            throw new RuntimeException("Division not found with id: " + id);
        }
        divisionRepository.deleteById(id);
    }

    @Override
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
        return BulkUploadResult.builder()
                .totalReceived(requests.size())
                .successCount(success)
                .failureCount(failure)
                .results(results)
                .build();
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
