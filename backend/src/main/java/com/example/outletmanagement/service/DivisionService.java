package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.request.DivisionRequest;
import com.example.outletmanagement.payload.dto.response.DivisionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface DivisionService {
    DivisionResponse createDivision(DivisionRequest request);
    Page<DivisionResponse> getAllDivisions(String search, Boolean hasProducts, Pageable pageable);
    DivisionResponse updateDivision(Long id, DivisionRequest request);
    DivisionResponse getDivisionById(Long id);
    void deleteDivision(Long id);
}
