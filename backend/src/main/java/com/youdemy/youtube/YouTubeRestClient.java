package com.youdemy.youtube;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youdemy.common.exception.YouTubeApiException;
import com.youdemy.youtube.config.YouTubeProperties;
import com.youdemy.youtube.dto.YouTubePlaylistInfo;
import com.youdemy.youtube.dto.YouTubeVideoItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

@Slf4j
@Component
public class YouTubeRestClient implements YouTubeApiClient {

    private static final int MAX_PAGES = 500;
    private static final int MAX_RETRIES = 3;
    private static final int DURATION_BATCH_SIZE = 50;

    private final YouTubeProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public YouTubeRestClient(YouTubeProperties properties, RestClient.Builder restClientBuilder,
                             ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = restClientBuilder
                .baseUrl(properties.baseUrl())
                .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                    String body = response.getBody() == null ? ""
                            : new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    throw parseApiError(body, response.getStatusCode());
                })
                .build();
    }

    @Override
    public YouTubePlaylistInfo fetchPlaylistInfo(String playlistId) {
        requireApiKey();
        JsonNode body = withRetry(() -> restClient.get()
                .uri(uri -> uri.path("/playlists")
                        .queryParam("part", "snippet")
                        .queryParam("id", playlistId)
                        .queryParam("key", properties.apiKey())
                        .build())
                .retrieve()
                .body(JsonNode.class));

        JsonNode items = body == null ? null : body.path("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            throw new YouTubeApiException("This playlist was not found or is not publicly accessible.", "playlistNotFound");
        }
        JsonNode snippet = items.get(0).path("snippet");
        return new YouTubePlaylistInfo(
                playlistId,
                text(snippet, "title", "Untitled playlist"),
                text(snippet, "description", ""),
                thumbnailUrl(snippet),
                text(snippet, "channelTitle", "")
        );
    }

    @Override
    public List<YouTubeVideoItem> fetchPlaylistVideos(String playlistId) {
        requireApiKey();
        List<YouTubeVideoItem> videos = new ArrayList<>();
        String pageToken = null;
        int page = 0;

        do {
            final String token = pageToken;
            JsonNode body = withRetry(() -> restClient.get()
                    .uri(uri -> {
                        var builder = uri.path("/playlistItems")
                                .queryParam("part", "snippet")
                                .queryParam("playlistId", playlistId)
                                .queryParam("maxResults", properties.maxResults())
                                .queryParam("key", properties.apiKey());
                        if (token != null && !token.isBlank()) {
                            builder.queryParam("pageToken", token);
                        }
                        return builder.build();
                    })
                    .retrieve()
                    .body(JsonNode.class));

            JsonNode items = body == null ? null : body.path("items");
            if (items != null && items.isArray()) {
                for (JsonNode item : items) {
                    YouTubeVideoItem video = toVideoItem(item, videos.size());
                    if (video != null) {
                        videos.add(video);
                    }
                }
            }
            pageToken = body == null ? null : text(body, "nextPageToken", null);
            page++;
            if (page >= MAX_PAGES && pageToken != null) {
                throw new YouTubeApiException("Playlist pagination limit exceeded during import.", "badRequest");
            }
        } while (pageToken != null && !pageToken.isBlank());

        return videos;
    }

    @Override
    public Map<String, String> fetchDurations(List<String> videoIds) {
        requireApiKey();
        Map<String, String> durations = new LinkedHashMap<>();
        if (videoIds == null || videoIds.isEmpty()) {
            return durations;
        }

        for (int from = 0; from < videoIds.size(); from += DURATION_BATCH_SIZE) {
            List<String> batch = videoIds.subList(from, Math.min(from + DURATION_BATCH_SIZE, videoIds.size()));
            String joined = String.join(",", batch);
            JsonNode body = withRetry(() -> restClient.get()
                    .uri(uri -> uri.path("/videos")
                            .queryParam("part", "contentDetails")
                            .queryParam("id", joined)
                            .queryParam("maxResults", DURATION_BATCH_SIZE)
                            .queryParam("key", properties.apiKey())
                            .build())
                    .retrieve()
                    .body(JsonNode.class));

            JsonNode items = body == null ? null : body.path("items");
            if (items == null || !items.isArray()) {
                continue;
            }
            for (JsonNode item : items) {
                String id = text(item, "id", null);
                String duration = item.path("contentDetails").path("duration").asText(null);
                if (id != null && duration != null) {
                    durations.put(id, duration);
                }
            }
        }
        return durations;
    }

    private YouTubeVideoItem toVideoItem(JsonNode item, int fallbackPosition) {
        JsonNode snippet = item.path("snippet");
        String videoId = snippet.path("resourceId").path("videoId").asText(null);
        String title = text(snippet, "title", "");
        if (videoId == null || videoId.isBlank() || title.isBlank()
                || "Private video".equalsIgnoreCase(title) || "Deleted video".equalsIgnoreCase(title)) {
            return null;
        }
        int position = snippet.hasNonNull("position") ? snippet.path("position").asInt(fallbackPosition) : fallbackPosition;
        return new YouTubeVideoItem(
                videoId,
                title,
                text(snippet, "description", ""),
                thumbnailUrl(snippet),
                position
        );
    }

    private String thumbnailUrl(JsonNode snippet) {
        JsonNode thumbnails = snippet.path("thumbnails");
        for (String key : List.of("medium", "high", "default")) {
            String url = thumbnails.path(key).path("url").asText(null);
            if (url != null && !url.isBlank()) {
                return url;
            }
        }
        return null;
    }

    private String text(JsonNode node, String field, String fallback) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? fallback : value.asText(fallback);
    }

    private void requireApiKey() {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new YouTubeApiException(
                    "YouTube API key is not configured. Set YOUTUBE_API_KEY on the backend.",
                    "invalidKey");
        }
    }

    private <T> T withRetry(Supplier<T> action) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return action.get();
            } catch (ResourceAccessException ex) {
                last = ex;
                if (attempt < MAX_RETRIES) {
                    log.warn("YouTube API network error (attempt {}/{}): {}", attempt, MAX_RETRIES, ex.getMessage());
                    try {
                        Thread.sleep(150L * attempt);
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        throw new YouTubeApiException("Could not reach the YouTube API. Please try again later.", "networkFailure", last);
    }

    private YouTubeApiException parseApiError(String body, HttpStatusCode status) {
        String message = "YouTube API request failed (" + status.value() + ").";
        String reason = "unknown";
        try {
            if (body != null && !body.isBlank()) {
                JsonNode error = objectMapper.readTree(body).path("error");
                message = error.path("message").asText(message);
                JsonNode reasons = error.path("errors");
                if (reasons.isArray() && !reasons.isEmpty()) {
                    reason = reasons.get(0).path("reason").asText(reason);
                }
            }
        } catch (Exception parseException) {
            log.debug("Could not parse YouTube error body: {}", body);
        }
        return new YouTubeApiException("YouTube: " + message, reason);
    }
}
