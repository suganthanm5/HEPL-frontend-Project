package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Division;
import com.example.outletmanagement.payload.dto.request.DivisionRequest;
import com.example.outletmanagement.payload.dto.response.DivisionResponse;
import com.example.outletmanagement.payload.dto.response.ProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.service.DivisionService;
import com.example.outletmanagement.specification.DivisionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DivisionServiceImpl implements DivisionService {
    private final DivisionRepository divisionRepository;

    @Override
    public DivisionResponse createDivision(DivisionRequest request) {
        if (divisionRepository.findAll().stream().anyMatch(d -> d.getName().equalsIgnoreCase(request.getName()))) {
            throw new RuntimeException("Division with name '" + request.getName() + "' already exists");
        }
        Division division = Division.builder()
                .name(request.getName())
                .build();
        Division savedDivision = divisionRepository.save(division);
        return mapToResponse(savedDivision);
    }

    @Override
    public Page<DivisionResponse> getAllDivisions(String search, Boolean hasProducts, Pageable pageable) {
        return divisionRepository.findAll(DivisionSpecification.searchAndFilter(search, hasProducts), pageable)
                .map(this::mapToResponse);
    }

    @Override
    public DivisionResponse updateDivision(Long id, DivisionRequest request) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + id));
        
        if (divisionRepository.findAll().stream().anyMatch(d -> !d.getId().equals(id) && d.getName().equalsIgnoreCase(request.getName()))) {
            throw new RuntimeException("Division with name '" + request.getName() + "' already exists");
        }

        division.setName(request.getName());
        Division updatedDivision = divisionRepository.save(division);
        return mapToResponse(updatedDivision);
    }

    @Override
    public DivisionResponse getDivisionById(Long id) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with id: " + id));
        return mapToResponse(division);
    }

    @Override
    public void deleteDivision(Long id) {
        if (!divisionRepository.existsById(id)) {
            throw new RuntimeException("Division not found with id: " + id);
        }
        divisionRepository.deleteById(id);
    }

    private DivisionResponse mapToResponse(Division division) {
        return DivisionResponse.builder()
                .id(division.getId())
                .name(division.getName())
                .products(division.getProducts() == null ? List.of() : 
                        division.getProducts().stream()
                                .map(p -> ProductResponse.builder()
                                        .id(p.getId())
                                        .name(p.getName())
                                        .productCode(p.getProductCode())
                                        .uimPrice(p.getUimPrice())
                                        .mrp(p.getMrp())
                                        .sellingPrice(p.getSellingPrice())
                                        .purchasePrice(p.getPurchasePrice())
                                        .build())
                                .collect(Collectors.toList()))
                .build();
    }
}
