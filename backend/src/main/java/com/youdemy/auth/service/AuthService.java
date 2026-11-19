package com.youdemy.auth.service;

import com.youdemy.auth.dto.AuthResponse;
import com.youdemy.auth.dto.LoginRequest;
import com.youdemy.auth.dto.RegisterRequest;
import com.youdemy.common.exception.ConflictException;
import com.youdemy.config.JwtService;
import com.youdemy.user.dto.UserDto;
import com.youdemy.user.entity.UserEntity;
import com.youdemy.user.repository.UserRepository;
import com.youdemy.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists.");
        }

        UserEntity user = new UserEntity(email, passwordEncoder.encode(request.password()));
        user = userRepository.save(user);
        return authResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        UUID userId = UUID.fromString(principal.getUsername());
        UserEntity user = userService.getById(userId);
        return authResponse(user);
    }

    public UserDto me() {
        return userService.currentUserDto();
    }

    private AuthResponse authResponse(UserEntity user) {
        return new AuthResponse(jwtService.generateAccessToken(user.getId()), "Bearer", userService.toDto(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
