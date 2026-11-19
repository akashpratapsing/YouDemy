package com.youdemy.youtube.dto;

public record YouTubeVideoItem(
        String videoId,
        String title,
        String description,
        String thumbnailUrl,
        int position
) {
}
