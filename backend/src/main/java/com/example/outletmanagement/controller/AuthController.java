package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.ApiResponse;
import com.example.outletmanagement.payload.dto.request.LoginRequest;
import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.response.AuthResponse;
import com.example.outletmanagement.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        if (response.getToken() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .httpStatus(HttpStatus.BAD_REQUEST.value())
                    .message("Registration failed")
                    .data(null)
                    .build());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.CREATED.value())
                .message("Registration successful")
                .data(response)
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.builder()
                .httpStatus(HttpStatus.OK.value())
                .message("Login successful")
                .data(response)
                .build());
    }

    @PostMapping("/google-login")
    public ResponseEntity<ApiResponse> googleLogin(@RequestBody java.util.Map<String, String> request) {
        String token = request.get("token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .httpStatus(HttpStatus.BAD_REQUEST.value())
                    .message("Token is required")
                    .data(null)
                    .build());
        }
        
        try {
            AuthResponse response = authService.googleLogin(token);
            return ResponseEntity.ok(ApiResponse.builder()
                    .httpStatus(HttpStatus.OK.value())
                    .message("Google login successful")
                    .data(response)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.builder()
                    .httpStatus(HttpStatus.UNAUTHORIZED.value())
                    .message("Google login failed: " + e.getMessage())
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse> validateToken(@RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.builder()
                    .httpStatus(HttpStatus.BAD_REQUEST.value())
                    .message("Invalid Authorization header")
                    .data(false)
                    .build());
        }

        String jwtToken = token.substring(7);
        boolean isValid = authService.validateToken(jwtToken);

        if (isValid) {
            return ResponseEntity.ok(ApiResponse.builder()
                    .httpStatus(HttpStatus.OK.value())
                    .message("Token is valid")
                    .data(true)
                    .build());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.builder()
                .httpStatus(HttpStatus.UNAUTHORIZED.value())
                .message("Invalid token")
                .data(false)
                .build());
    }
}
