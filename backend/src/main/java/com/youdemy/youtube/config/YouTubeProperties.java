package com.youdemy.youtube.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.youtube")
public record YouTubeProperties(String apiKey, String baseUrl, int maxResults) {
    public String baseUrl() {
        return baseUrl == null || baseUrl.isBlank() ? "https://www.googleapis.com/youtube/v3" : baseUrl;
    }

    public int maxResults() {
        return maxResults <= 0 ? 50 : Math.min(maxResults, 50);
    }
}
