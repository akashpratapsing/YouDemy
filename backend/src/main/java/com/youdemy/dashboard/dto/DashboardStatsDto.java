package com.youdemy.dashboard.dto;

public record DashboardStatsDto(
        int totalPlaylists,
        int totalVideos,
        int completedVideos,
        int remainingVideos,
        double overallProgress
) {
}
