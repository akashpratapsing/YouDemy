package com.youdemy.dashboard.dto;

import java.time.Instant;
import java.util.UUID;

public record LearningActivityDto(
        UUID videoId,
        String videoTitle,
        UUID playlistId,
        String playlistTitle,
        String thumbnailUrl,
        Instant completedAt
) {
}
