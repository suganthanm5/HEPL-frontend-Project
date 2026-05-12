package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Location;
import com.example.outletmanagement.payload.dto.request.LocationRequest;
import com.example.outletmanagement.payload.dto.response.LocationResponse;
import com.example.outletmanagement.repository.LocationRepository;
import com.example.outletmanagement.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {
    private final LocationRepository locationRepository;

    @Override
    public LocationResponse createLocation(LocationRequest request) {
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
        location.setName(request.getName());
        Location updatedLocation = locationRepository.save(location);
        return mapToResponse(updatedLocation);
    }

    @Override
    public void deleteLocation(Long id) {
        locationRepository.deleteById(id);
    }

    private LocationResponse mapToResponse(Location location) {
        return LocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .build();
    }
}
