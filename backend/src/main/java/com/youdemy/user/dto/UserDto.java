package com.youdemy.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserDto(UUID id, String email, Instant createdAt) {
}
