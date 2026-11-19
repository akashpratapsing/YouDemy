package com.youdemy.video.dto;

import java.util.UUID;

public record VideoDto(
        UUID id,
        String youtubeVideoId,
        String title,
        String description,
        String thumbnailUrl,
        String duration,
        long durationSeconds,
        int position,
        boolean completed
) {
}
