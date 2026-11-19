package com.youdemy.user.service;

import com.youdemy.common.exception.ResourceNotFoundException;
import com.youdemy.common.exception.UnauthorizedException;
import com.youdemy.user.dto.UserDto;
import com.youdemy.user.entity.UserEntity;
import com.youdemy.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserEntity getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    public UserDto toDto(UserEntity user) {
        return new UserDto(user.getId(), user.getEmail(), user.getCreatedAt());
    }

    /** Always derive the caller from the security context, never from a request parameter. */
    public UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() instanceof String) {
            throw new UnauthorizedException("Authentication is required.");
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedException("Invalid authentication principal.");
        }
    }

    public UserEntity currentUser() {
        return getById(currentUserId());
    }

    public UserDto currentUserDto() {
        return toDto(currentUser());
    }

    public UserDetails currentUserDetails() {
        return (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
