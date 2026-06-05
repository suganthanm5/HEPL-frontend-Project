package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.request.LoginRequest;
import com.example.outletmanagement.payload.dto.request.RegisterRequest;
import com.example.outletmanagement.payload.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse googleLogin(String token);
    boolean validateToken(String token);
    AuthResponse impersonate(Long userId);
}
