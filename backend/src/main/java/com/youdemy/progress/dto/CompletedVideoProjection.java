package com.youdemy.progress.dto;

import java.time.Instant;
import java.util.UUID;

public record CompletedVideoProjection(
        UUID videoId,
        String videoTitle,
        UUID playlistId,
        String playlistTitle,
        String thumbnailUrl,
        Instant completedAt
) {
}
