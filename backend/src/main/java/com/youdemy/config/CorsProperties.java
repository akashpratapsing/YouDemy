package com.youdemy.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {
    public List<String> allowedOrigins() {
        return allowedOrigins == null || allowedOrigins.isEmpty()
                ? List.of("http://localhost:5173", "http://localhost:3000")
                : allowedOrigins;
    }
}
