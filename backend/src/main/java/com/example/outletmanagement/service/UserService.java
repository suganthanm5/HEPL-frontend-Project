package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.request.UserCreationDto;
import com.example.outletmanagement.payload.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserResponse createUser(UserCreationDto request);
    Page<UserResponse> getAllUsers(String search, Pageable pageable);
    UserResponse getUserById(Long id);
    UserResponse updateUser(Long id, UserCreationDto request);
    UserResponse updateUserRole(Long id, String role);
    void deleteUser(Long id);
    UserResponse getCurrentUserProfile(Authentication authentication);
    UserResponse updateCurrentUserProfile(Authentication authentication, UserCreationDto request);
    void changePassword(Authentication authentication, String oldPassword, String newPassword);
    String uploadProfilePicture(Authentication authentication, MultipartFile file);
}