package com.youdemy.dashboard.dto;

import java.util.UUID;

public record ContinueLearningDto(
        UUID playlistId,
        String playlistTitle,
        String playlistThumbnailUrl,
        UUID videoId,
        String videoTitle,
        String videoThumbnailUrl,
        int completedVideos,
        int totalVideos,
        double progress
) {
}
