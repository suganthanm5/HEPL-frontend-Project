package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.entity.User;
import com.example.outletmanagement.entity.User.Role;
import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.request.UserCreateRequest;
import com.example.outletmanagement.payload.dto.response.UserResponse;
import com.example.outletmanagement.repository.UserRepository;
import com.example.outletmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse createUser(UserCreateRequest request) {
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

            return mapToResponse(userRepository.save(user));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create user: " + e.getMessage());
        }
    }

    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    @Override
    public UserResponse updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(Role.valueOf(role.toUpperCase()));
        return mapToResponse(userRepository.save(user));
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
