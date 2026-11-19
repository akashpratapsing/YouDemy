package com.youdemy.dashboard.dto;

import com.youdemy.playlist.dto.PlaylistSummaryDto;

import java.util.List;

public record DashboardDto(
        DashboardStatsDto stats,
        List<PlaylistSummaryDto> recentPlaylists,
        List<ContinueLearningDto> continueLearning,
        List<LearningActivityDto> recentActivity
) {
}
