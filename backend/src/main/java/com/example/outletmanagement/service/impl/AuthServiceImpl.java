package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.config.JwtService;
import com.example.outletmanagement.entity.User;
import com.example.outletmanagement.payload.dto.request.LoginRequest;
import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.response.AuthResponse;
import com.example.outletmanagement.repository.UserRepository;
import com.example.outletmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsernameAll(request.getUsername()) > 0) {
            throw new RuntimeException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmailAll(request.getEmail()) > 0) {
            throw new RuntimeException("Email '" + request.getEmail() + "' is already in use.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .name(user.getName())
                .outletId(user.getOutlet() != null ? user.getOutlet().getId() : null)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + request.getUsername()));
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .name(user.getName())
                .outletId(user.getOutlet() != null ? user.getOutlet().getId() : null)
                .build();
    }

    @Override
    public boolean validateToken(String token) {
        try {
            String username = jwtService.extractUsername(token);
            User user = userRepository.findByUsername(username).orElse(null);
            return user != null && jwtService.isTokenValid(token, user);
        } catch (Exception e) {
            return false;
        }
    }
}
