package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.request.UserCreationDto;
import com.example.outletmanagement.payload.dto.response.UserResponse;
import com.example.outletmanagement.service.UserService;
import com.example.outletmanagement.service.AuthService;
import com.example.outletmanagement.payload.dto.response.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> createUser(@Valid @RequestBody UserCreationDto request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("User created successfully")
                .data(response)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String activeSearch = keyword != null ? keyword : search;
        Page<UserResponse> response = userService.getAllUsers(activeSearch, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Users fetched successfully")
                .data(response)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("User fetched successfully")
                .data(response)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UserCreationDto request) {
        UserResponse response = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("User updated successfully")
                .data(response)
                .build());
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        UserResponse response = userService.updateUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("User role updated successfully")
                .data(response)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("User deleted successfully")
                .build());
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getCurrentUserProfile(Authentication authentication) {
        UserResponse response = userService.getCurrentUserProfile(authentication);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("User profile fetched successfully")
                .data(response)
                .build());
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateCurrentUserProfile(
            Authentication authentication,
            @Valid @RequestBody UserCreationDto request) {
        UserResponse response = userService.updateCurrentUserProfile(authentication, request);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("User profile updated successfully")
                .data(response)
                .build());
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .httpStatus(HttpStatus.BAD_REQUEST.value())
                    .message("New password is required")
                    .build());
        }
        
        try {
            userService.changePassword(authentication, oldPassword, newPassword);
            return ResponseEntity.ok(ApiResponse.builder()
                    .httpStatus(HttpStatus.OK.value())
                    .message("Password changed successfully")
                    .build());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .httpStatus(HttpStatus.BAD_REQUEST.value())
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/upload-picture")
    public ResponseEntity<ApiResponse> uploadProfilePicture(
            Authentication authentication,
            @RequestParam("profilePicture") MultipartFile file) {
        String picturePath = userService.uploadProfilePicture(authentication, file);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Profile picture uploaded successfully")
                .data(java.util.Map.of("profilePictureUrl", picturePath))
                .build());
    }

    @PostMapping("/{id}/impersonate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> impersonateUser(@PathVariable Long id) {
        AuthResponse response = authService.impersonate(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Impersonation successful")
                .data(response)
                .build());
    }
}
