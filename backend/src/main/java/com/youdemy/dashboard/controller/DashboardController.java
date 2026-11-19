package com.youdemy.dashboard.controller;

import com.youdemy.common.ApiResponse;
import com.youdemy.dashboard.dto.DashboardDto;
import com.youdemy.dashboard.dto.LearningActivityDto;
import com.youdemy.dashboard.service.DashboardService;
import com.youdemy.playlist.dto.PlaylistSummaryDto;
import com.youdemy.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardDto> dashboard() {
        return ApiResponse.ok(dashboardService.getDashboard(userService.currentUserId()));
    }

    @GetMapping("/recently-watched")
    public ApiResponse<List<PlaylistSummaryDto>> recentlyWatched() {
        UUID userId = userService.currentUserId();
        return ApiResponse.ok(dashboardService.recentlyWatched(userId));
    }

    @GetMapping("/completed-videos")
    public ApiResponse<List<LearningActivityDto>> completedVideos() {
        UUID userId = userService.currentUserId();
        return ApiResponse.ok(dashboardService.completedVideos(userId));
    }
}
