package com.youdemy.playlist.dto;

import java.time.Instant;
import java.util.UUID;

/** Raw repository projection; the API DTO adds derived values such as percentage. */
public record PlaylistSummaryProjection(
        UUID userPlaylistId,
        UUID playlistId,
        String youtubePlaylistId,
        String title,
        String description,
        String thumbnailUrl,
        String channelTitle,
        int totalVideos,
        long completedVideos,
        Instant lastAccessedAt,
        Instant createdAt,
        UUID lastWatchedVideoId
) {
}
