package com.youdemy.progress.dto;

public record ProgressDto(
        int totalVideos,
        int completedVideos,
        int remainingVideos,
        double completionPercentage
) {
    public static ProgressDto of(int totalVideos, int completedVideos) {
        int safeCompleted = Math.min(Math.max(completedVideos, 0), totalVideos);
        double percentage = totalVideos == 0 ? 0.0 : safeCompleted * 100.0 / totalVideos;
        return new ProgressDto(totalVideos, safeCompleted, totalVideos - safeCompleted,
                Math.round(percentage * 100.0) / 100.0);
    }
}
