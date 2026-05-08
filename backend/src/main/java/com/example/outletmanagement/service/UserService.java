package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.request.UserCreationDto;
import com.example.outletmanagement.payload.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponse createUser(UserCreationDto request);
    Page<UserResponse> getAllUsers(Pageable pageable);
    UserResponse getUserById(Long id);
    UserResponse updateUser(Long id, UserCreationDto request);
    UserResponse updateUserRole(Long id, String role);
    void deleteUser(Long id);
}
