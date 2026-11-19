package com.youdemy.playlist.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LastWatchedRequest(@NotNull(message = "A video is required.") UUID videoId) {
}
