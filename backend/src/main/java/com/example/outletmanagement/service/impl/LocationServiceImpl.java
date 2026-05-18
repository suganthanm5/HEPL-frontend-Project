package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Location;
import com.example.outletmanagement.payload.dto.request.LocationRequest;
import com.example.outletmanagement.payload.dto.response.BulkUploadResult;
import com.example.outletmanagement.payload.dto.response.LocationResponse;
import com.example.outletmanagement.repository.LocationRepository;
import com.example.outletmanagement.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {
    private final LocationRepository locationRepository;

    @Override
    public LocationResponse createLocation(LocationRequest request) {
        java.util.Optional<Location> existingOpt = locationRepository.findByNameIncludingDeleted(request.getName());
        if (existingOpt.isPresent()) {
            Location existing = existingOpt.get();
            if (existing.getIsDeleted() != null && existing.getIsDeleted()) {
                existing.setIsDeleted(false);
                Location restored = locationRepository.save(existing);
                return mapToResponse(restored);
            } else {
                throw new RuntimeException("Location already exists!");
            }
        }
        
        Location location = Location.builder()
                .name(request.getName())
                .build();
        Location savedLocation = locationRepository.save(location);
        return mapToResponse(savedLocation);
    }

    @Override
    public Page<LocationResponse> getAllLocations(String search, Pageable pageable) {
        Page<Location> locations;

        if (search != null && !search.isBlank()) {
            locations = locationRepository.findByNameContainingIgnoreCase(search, pageable);
        } else {
            locations = locationRepository.findAll(pageable);
        }

        return locations.map(this::mapToResponse);
    }

    @Override
    public LocationResponse getLocationById(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));
        return mapToResponse(location);
    }

    @Override
    public LocationResponse updateLocation(Long id, LocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));
                
        java.util.Optional<Location> existingOpt = locationRepository.findByNameIncludingDeleted(request.getName());
        if (existingOpt.isPresent()) {
            Location existing = existingOpt.get();
            if (!existing.getId().equals(id)) {
                if (existing.getIsDeleted() != null && existing.getIsDeleted()) {
                    throw new RuntimeException("A deleted location with this name already exists. Please restore it by adding it as a new location.");
                } else {
                    throw new RuntimeException("Location already exists!");
                }
            }
        }
                
        location.setName(request.getName());
        Location updatedLocation = locationRepository.save(location);
        return mapToResponse(updatedLocation);
    }

    @Override
    @Transactional
    public void deleteLocation(Long id) {
        locationRepository.deleteById(id);
    }

    @Override
    public BulkUploadResult bulkCreateLocations(List<LocationRequest> requests) {
        List<BulkUploadResult.RowResult> results = new ArrayList<>();
        int success = 0, failure = 0;
        for (int i = 0; i < requests.size(); i++) {
            LocationRequest req = requests.get(i);
            try {
                createLocation(req);
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

    private LocationResponse mapToResponse(Location location) {
        return LocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .build();
    }
}
