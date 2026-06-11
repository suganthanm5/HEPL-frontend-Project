package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.payload.dto.request.OutletRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.DivisionResponse;
import com.example.outletmanagement.payload.dto.response.OutletResponse;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.service.OutletService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

import com.example.outletmanagement.websocket.WebSocketEventPublisher;

@Service
@RequiredArgsConstructor
public class OutletServiceImpl implements OutletService {
    private final OutletRepository outletRepository;
    private final LocationRepository locationRepository;
    private final DivisionRepository divisionRepository;
    private final ProductRepository productRepository;
    private final OutletDivisionProductRepository mappingRepository;
    private final UserRepository userRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final com.example.outletmanagement.service.AuditLogService auditLogService;

    @Override
    @Transactional
    @CacheEvict(value = "outlets", allEntries = true)
    public OutletResponse createOutlet(OutletRequest request) {
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        Outlet outlet = Outlet.builder()
                .outletName(request.getOutletName())
                .outletCode("OUT-" + System.currentTimeMillis() % 100000)
                .outletType(request.getOutletType())
                .ownerName(request.getOwnerName())
                .address(request.getAddress())
                .location(location)
                .build();

        Outlet savedOutlet = outletRepository.save(outlet);

        if (request.getMappings() != null) {
            for (OutletRequest.OutletMappingRequest m : request.getMappings()) {
                Division division = divisionRepository.findById(m.getDivisionId())
                        .orElseThrow(() -> new RuntimeException("Division not found"));
                Product product = productRepository.findById(m.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));

                OutletDivisionProduct mapping = OutletDivisionProduct.builder()
                        .outlet(savedOutlet)
                        .division(division)
                        .product(product)
                        .build();
                mappingRepository.save(mapping);
            }
        }

        OutletResponse response = mapToResponse(outletRepository.findByIdWithMappings(savedOutlet.getId()).orElse(savedOutlet));
        auditLogService.log("CREATE_OUTLET", "Created outlet: " + response.getOutletName() + " (Code: " + response.getOutletCode() + ")");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "outlets", key = "T(java.util.Objects).hash(#search, #locationId, #type, #divisionId, #pageable.pageNumber, #pageable.pageSize)")
    public Page<OutletResponse> getAllOutlets(String search, Long locationId, String type, Long divisionId,
            Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        // Removed role-based restriction so all users can see available outlets in dropdowns

        org.springframework.data.jpa.domain.Specification<Outlet> spec = 
                com.example.outletmanagement.specification.OutletSpecification.searchAndFilter(
                        search, locationId, type, divisionId);
        Page<Outlet> outlets = outletRepository.findAll(spec, pageable);

        List<Long> outletIds = outlets.getContent().stream().map(Outlet::getId).collect(Collectors.toList());
        List<Outlet> outletsWithMappings = outletRepository.findAllByIdWithMappings(outletIds);
        Map<Long, Outlet> outletMap = outletsWithMappings.stream().collect(Collectors.toMap(Outlet::getId, o -> o));

        List<OutletResponse> responses = outlets.getContent().stream()
                .map(outlet -> mapToResponse(outletMap.getOrDefault(outlet.getId(), outlet)))
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, outlets.getTotalElements());
    }

    @Override
    @Transactional
    @CacheEvict(value = "outlets", allEntries = true)
    public OutletResponse updateOutlet(Long id, OutletRequest request) {
        Outlet outlet = outletRepository.findByIdWithMappings(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found"));

        outlet.setOutletName(request.getOutletName());
        outlet.setOutletType(request.getOutletType());
        outlet.setOwnerName(request.getOwnerName());
        outlet.setAddress(request.getAddress());

        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found"));
            outlet.setLocation(location);
        }

        if (request.getMappings() != null) {
            outlet.getMappings().clear();
            outletRepository.saveAndFlush(outlet);

            for (OutletRequest.OutletMappingRequest m : request.getMappings()) {
                Division division = divisionRepository.findById(m.getDivisionId())
                        .orElseThrow(() -> new RuntimeException("Division not found"));
                Product product = productRepository.findById(m.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));

                OutletDivisionProduct mapping = OutletDivisionProduct.builder()
                        .outlet(outlet)
                        .division(division)
                        .product(product)
                        .build();
                mappingRepository.save(mapping);
            }
        }

        outletRepository.save(outlet);
        OutletResponse response = mapToResponse(outletRepository.findByIdWithMappings(id).orElse(outlet));
        auditLogService.log("UPDATE_OUTLET", "Updated outlet: " + response.getOutletName() + " (ID: " + response.getId() + ")");
        return response;
    }

    @Override
    @CacheEvict(value = "outlets", allEntries = true)
    public BulkUploadResult bulkCreateOutlets(List<OutletRequest> requests) {
        List<BulkUploadResult.RowResult> results = new ArrayList<>();
        int success = 0, failure = 0;
        for (int i = 0; i < requests.size(); i++) {
            OutletRequest req = requests.get(i);
            try {
                createOutlet(req);
                results.add(BulkUploadResult.RowResult.builder()
                        .row(i + 1).name(req.getOutletName()).success(true).build());
                success++;
            } catch (Exception e) {
                results.add(BulkUploadResult.RowResult.builder()
                        .row(i + 1).name(req.getOutletName()).success(false).error(e.getMessage()).build());
                failure++;
            }
        }
        BulkUploadResult result = BulkUploadResult.builder()
                .totalReceived(requests.size())
                .successCount(success)
                .failureCount(failure)
                .results(results)
                .build();
        auditLogService.log("BULK_CREATE_OUTLETS", "Bulk created outlets. Success: " + success + ", Failures: " + failure);
        return result;
    }

    @Override
    @Transactional
    @CacheEvict(value = "outlets", allEntries = true)
    public void deleteOutlet(Long id) {
        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found with id: " + id));
        outletRepository.deleteById(id);
        auditLogService.log("DELETE_OUTLET", "Deleted outlet ID: " + id + " (Name: " + outlet.getOutletName() + ")");

        try {
            webSocketEventPublisher.publishNotification("Outlet deleted: " + outlet.getOutletName(), "OUTLET_DELETED");
        } catch (Exception e) {
            // Log warning but do not fail the transaction
        }
    }

    private OutletResponse mapToResponse(Outlet outlet) {
        List<OutletResponse.MappingResponse> mappingResponses = new ArrayList<>();
        if (outlet.getMappings() != null && !outlet.getMappings().isEmpty()) {
            for (OutletDivisionProduct m : outlet.getMappings()) {
                if (m.getDivision() != null && m.getProduct() != null) {
                    mappingResponses.add(OutletResponse.MappingResponse.builder()
                            .divisionId(m.getDivision().getId())
                            .divisionName(m.getDivision().getName())
                            .productId(m.getProduct().getId())
                            .productName(m.getProduct().getName())
                            .productCode(m.getProduct().getProductCode())
                            .build());
                }
            }
        }

        return OutletResponse.builder()
                .id(outlet.getId())
                .outletName(outlet.getOutletName())
                .outletCode(outlet.getOutletCode())
                .locationId(outlet.getLocation() != null ? outlet.getLocation().getId() : null)
                .locationName(outlet.getLocation() != null ? outlet.getLocation().getName() : null)
                .outletType(outlet.getOutletType())
                .ownerName(outlet.getOwnerName())
                .address(outlet.getAddress())
                .mappings(mappingResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "outlets", key = "#id")
    public OutletResponse getOutletById(Long id) {
        Outlet outlet = outletRepository.findByIdWithMappings(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found with id: " + id));
        return mapToResponse(outlet);
    }
}
