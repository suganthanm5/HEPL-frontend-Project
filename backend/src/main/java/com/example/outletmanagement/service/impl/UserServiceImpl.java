package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.Outlet;
import com.example.outletmanagement.entity.User;
import com.example.outletmanagement.entity.User.Role;
import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.request.UserCreationDto;
import com.example.outletmanagement.payload.dto.response.UserResponse;
import com.example.outletmanagement.repository.OutletRepository;
import com.example.outletmanagement.repository.UserRepository;
import com.example.outletmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OutletRepository outletRepository;
    private final com.example.outletmanagement.service.AuditLogService auditLogService;

    @Override
    public UserResponse createUser(UserCreationDto request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new RuntimeException("Password is required for new users");
        }
        try {
            if (userRepository.existsByUsernameAll(request.getUsername()) > 0) {
                throw new RuntimeException("Username '" + request.getUsername() + "' is already taken (even if deleted). Please use a different one.");
            }
            if (userRepository.existsByEmailAll(request.getEmail()) > 0) {
                throw new RuntimeException("Email '" + request.getEmail() + "' is already in use.");
            }

            User user = User.builder()
                    .name(request.getName() != null ? request.getName().trim() : null)
                    .username(request.getUsername() != null ? request.getUsername().trim() : null)
                    .email(request.getEmail() != null ? request.getEmail().trim() : null)
                    .password(passwordEncoder.encode(request.getPassword().trim()))
                    .role(request.getRole() != null ? Role.valueOf(request.getRole().toUpperCase()) : Role.USER)
                    .createdAt(new java.util.Date())
                    .updatedAt(new java.util.Date())
                    .isDeleted(false)
                    .build();

            if (request.getOutletId() != null) {
                Outlet outlet = outletRepository.findById(request.getOutletId())
                        .orElseThrow(() -> new RuntimeException("Outlet not found"));
                user.setOutlet(outlet);
                if (user.getRole() == Role.USER) {
                    user.setRole(Role.OUTLET_MANAGER);
                }
            }

            User savedUser = userRepository.save(user);
            UserResponse response = mapToResponse(savedUser);
            auditLogService.log("CREATE_USER", "Created user: " + response.getUsername() + " (Role: " + response.getRole() + ")");
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create user: " + e.getMessage());
        }
    }

    @Override
    public Page<UserResponse> getAllUsers(String search, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<User> spec = 
                com.example.outletmanagement.specification.UserSpecification.searchAndFilter(search);
        return userRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    @Override
    public UserResponse updateUser(Long id, UserCreationDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setName(request.getName() != null ? request.getName().trim() : user.getName());
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : user.getEmail());
        user.setUsername(request.getUsername() != null ? request.getUsername().trim() : user.getUsername());
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture().trim());
        }
        
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }
        
        if (request.getRole() != null) {
            user.setRole(Role.valueOf(request.getRole().toUpperCase()));
        }
        
        if (request.getOutletId() != null) {
            Outlet outlet = outletRepository.findById(request.getOutletId())
                    .orElseThrow(() -> new RuntimeException("Outlet not found"));
            user.setOutlet(outlet);
            if (user.getRole() == Role.USER) {
                user.setRole(Role.OUTLET_MANAGER);
            }
        } else {
            user.setOutlet(null);
        }
        
        user.setUpdatedAt(new java.util.Date());
        
        User updatedUser = userRepository.save(user);
        auditLogService.log("UPDATE_USER", "Updated user profile/roles for: " + updatedUser.getUsername() + " (ID: " + updatedUser.getId() + ")");
        return mapToResponse(updatedUser);
    }

    @Override
    public UserResponse updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(Role.valueOf(role.toUpperCase()));
        User saved = userRepository.save(user);
        auditLogService.log("UPDATE_USER_ROLE", "Updated user role for " + saved.getUsername() + " (ID: " + id + ") to " + role);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        String username = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (currentUser.getId().equals(id)) {
            throw new RuntimeException("You cannot delete your own account");
        }
        User userToDelete = userRepository.findById(id).orElse(null);
        userRepository.deleteById(id);
        if (userToDelete != null) {
            auditLogService.log("DELETE_USER", "Deleted user: " + userToDelete.getUsername() + " (ID: " + id + ")");
        }
    }

    @Override
    public UserResponse getCurrentUserProfile(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    @Override
    public UserResponse updateCurrentUserProfile(Authentication authentication, UserCreationDto request) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getName() != null) {
            user.setName(request.getName().trim());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().trim());
        }
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture().trim());
        }
        
        user.setUpdatedAt(new java.util.Date());
        User saved = userRepository.save(user);
        auditLogService.log(username, "UPDATE_PROFILE", "User " + username + " updated their own profile details.");
        return mapToResponse(saved);
    }

    @Override
    public void changePassword(Authentication authentication, String oldPassword, String newPassword) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        user.setUpdatedAt(new java.util.Date());
        userRepository.save(user);
        auditLogService.log(username, "CHANGE_PASSWORD", "User " + username + " changed their password.");
    }

    @Override
    public String uploadProfilePicture(Authentication authentication, MultipartFile file) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        try {
            String uploadDir = "uploads/profile-pictures";
            Files.createDirectories(Paths.get(uploadDir));
            
            String filename = username + "_" + System.currentTimeMillis() + ".jpg";
            Path filepath = Paths.get(uploadDir, filename);
            Files.write(filepath, file.getBytes());
            
            String picturePath = "/uploads/profile-pictures/" + filename;
            user.setProfilePicture(picturePath);
            user.setUpdatedAt(new java.util.Date());
            userRepository.save(user);
            
            return picturePath;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload profile picture: " + e.getMessage());
        }
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .outletId(user.getOutlet() != null ? user.getOutlet().getId() : null)
                .profilePicture(user.getProfilePicture())
                .build();
    }
}