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

import com.example.outletmanagement.websocket.WebSocketEventPublisher;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.service.EmailService;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

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
        
        emailService.sendUserRegistrationNotification(user);
        
        auditLogService.log(user.getUsername(), "USER_REGISTER", "User registered: " + user.getUsername() + " (Email: " + user.getEmail() + ")");

        try {
            webSocketEventPublisher.publishNotification("New user registered: " + user.getUsername(), "USER_REGISTERED");
        } catch (Exception e) {
            // Log warning but do not fail the registration transaction
        }

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

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            auditLogService.log(username, "USER_LOGIN_FAILED", "Failed login attempt for username: " + username);
            throw new RuntimeException("Incorrect username or password");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + request.getUsername()));
        String token = jwtService.generateToken(user);
        auditLogService.log(user.getUsername(), "USER_LOGIN", "User logged in: " + user.getUsername());
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
    public AuthResponse googleLogin(String token) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;

            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.getForEntity(url,
                    java.util.Map.class);

            java.util.Map<String, Object> payload = response.getBody();
            if (payload != null && payload.containsKey("email")) {
                String email = (String) payload.get("email");
                String name = (String) payload.get("name");

                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = User.builder()
                            .username(email.split("@")[0] + "_" + System.currentTimeMillis())
                            .email(email)
                            .name(name)
                            .password(passwordEncoder.encode("GOOGLE_LOGIN_PASSWORD_" + System.currentTimeMillis()))
                            .role(User.Role.USER)
                            .build();
                    userRepository.save(user);
                    
                    emailService.sendUserRegistrationNotification(user);
                    
                    auditLogService.log(user.getUsername(), "USER_REGISTER_GOOGLE", "New user registered via Google: " + user.getUsername());

                    try {
                        webSocketEventPublisher.publishNotification("New user registered: " + user.getUsername(), "USER_REGISTERED");
                    } catch (Exception e) {
                        // Log warning but do not fail the registration transaction
                    }
                }

                String jwtToken = jwtService.generateToken(user);
                auditLogService.log(user.getUsername(), "USER_LOGIN_GOOGLE", "User logged in via Google: " + user.getUsername());
                return AuthResponse.builder()
                        .token(jwtToken)
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole() != null ? user.getRole().name() : "USER")
                        .name(user.getName())
                        .outletId(user.getOutlet() != null ? user.getOutlet().getId() : null)
                        .build();
            } else {
                throw new RuntimeException("Could not fetch user profile from Google.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Google Authentication Failed: " + e.getMessage());
        }
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

    @Override
    public AuthResponse impersonate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        String token = jwtService.generateToken(user);
        auditLogService.log("USER_IMPERSONATE", "Admin impersonated user ID: " + userId + " (" + user.getUsername() + ")");
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .name(user.getName())
                .outletId(user.getOutlet() != null ? user.getOutlet().getId() : null)
                .build();
    }
}
