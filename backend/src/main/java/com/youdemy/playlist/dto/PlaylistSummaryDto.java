package com.youdemy.playlist.dto;

import java.time.Instant;
import java.util.UUID;

public record PlaylistSummaryDto(
        UUID userPlaylistId,
        UUID id,
        String youtubePlaylistId,
        String title,
        String description,
        String thumbnailUrl,
        String channelTitle,
        int totalVideos,
        int completedVideos,
        int completionPercentage,
        Instant lastAccessedAt,
        Instant createdAt,
        UUID lastWatchedVideoId,
        boolean completed,
        boolean inProgress
) {
    public static PlaylistSummaryDto from(PlaylistSummaryProjection row) {
        int percentage = row.totalVideos() == 0 ? 0
                : (int) Math.round(row.completedVideos() * 100.0 / row.totalVideos());
        return new PlaylistSummaryDto(
                row.userPlaylistId(), row.playlistId(), row.youtubePlaylistId(), row.title(),
                row.description(), row.thumbnailUrl(), row.channelTitle(), row.totalVideos(),
                (int) row.completedVideos(), percentage, row.lastAccessedAt(), row.createdAt(),
                row.lastWatchedVideoId(), percentage == 100 && row.totalVideos() > 0,
                percentage < 100
        );
    }
}
