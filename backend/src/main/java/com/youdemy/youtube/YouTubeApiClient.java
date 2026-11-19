package com.youdemy.youtube;

import com.youdemy.youtube.dto.YouTubePlaylistInfo;
import com.youdemy.youtube.dto.YouTubeVideoItem;

import java.util.List;
import java.util.Map;

/** Boundary to the YouTube Data API v3. Kept free of YouDemy business logic. */
public interface YouTubeApiClient {

    YouTubePlaylistInfo fetchPlaylistInfo(String playlistId);

    List<YouTubeVideoItem> fetchPlaylistVideos(String playlistId);

    Map<String, String> fetchDurations(List<String> videoIds);
}
