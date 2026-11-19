package com.youdemy.auth.dto;

import com.youdemy.user.dto.UserDto;

public record AuthResponse(String token, String tokenType, UserDto user) {
}
