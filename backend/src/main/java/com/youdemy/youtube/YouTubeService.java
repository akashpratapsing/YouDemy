package com.youdemy.youtube;

import com.youdemy.youtube.dto.YouTubeImportResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Orchestrates YouTube API calls; all persistence decisions belong to the playlist module. */
@Service
@RequiredArgsConstructor
public class YouTubeService {

    private final YouTubeApiClient apiClient;

    public YouTubeImportResult fetchPlaylist(String playlistId) {
        var playlist = apiClient.fetchPlaylistInfo(playlistId);
        var videos = apiClient.fetchPlaylistVideos(playlistId);
        var durations = apiClient.fetchDurations(videos.stream().map(v -> v.videoId()).toList());
        return new YouTubeImportResult(playlist, videos, durations);
    }
}
