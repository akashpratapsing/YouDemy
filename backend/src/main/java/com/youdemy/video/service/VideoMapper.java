package com.youdemy.video.service;

import com.youdemy.video.dto.VideoDto;
import com.youdemy.video.entity.VideoEntity;

import java.time.Duration;

public final class VideoMapper {

    private VideoMapper() {
    }

    public static VideoDto toDto(VideoEntity video, boolean completed) {
        return new VideoDto(
                video.getId(),
                video.getYoutubeVideoId(),
                video.getTitle(),
                video.getDescription(),
                video.getThumbnailUrl(),
                video.getDuration(),
                durationSeconds(video.getDuration()),
                video.getPosition(),
                completed
        );
    }

    public static long durationSeconds(String isoDuration) {
        if (isoDuration == null || isoDuration.isBlank()) {
            return 0;
        }
        try {
            return Duration.parse(isoDuration).getSeconds();
        } catch (RuntimeException ex) {
            return 0;
        }
    }
}
