package com.youdemy.auth.controller;

import com.youdemy.auth.dto.AuthResponse;
import com.youdemy.auth.dto.LoginRequest;
import com.youdemy.auth.dto.RegisterRequest;
import com.youdemy.auth.service.AuthService;
import com.youdemy.common.ApiResponse;
import com.youdemy.user.dto.UserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(authService.register(request), "Account created successfully."));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request), "Signed in successfully.");
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me() {
        return ApiResponse.ok(authService.me());
    }
}
