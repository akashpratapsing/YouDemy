package com.youdemy.youtube.dto;

import java.util.List;
import java.util.Map;

public record YouTubeImportResult(
        YouTubePlaylistInfo playlist,
        List<YouTubeVideoItem> videos,
        Map<String, String> durationsByVideoId
) {
}
