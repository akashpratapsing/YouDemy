package com.youdemy.youtube.dto;

public record YouTubePlaylistInfo(
        String youtubeId,
        String title,
        String description,
        String thumbnailUrl,
        String channelTitle
) {
}
