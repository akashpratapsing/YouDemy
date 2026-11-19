package com.youdemy.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Raised when the YouTube Data API cannot satisfy an import/resync request.
 */
public class YouTubeApiException extends AppException {

    private final String reason;

    public YouTubeApiException(String message, String reason) {
        super(mapStatus(reason), "YOUTUBE_API_ERROR", message);
        this.reason = reason == null ? "unknown" : reason;
    }

    public YouTubeApiException(String message, String reason, Throwable cause) {
        super(mapStatus(reason), "YOUTUBE_API_ERROR", message, cause);
        this.reason = reason == null ? "unknown" : reason;
    }

    public String reason() {
        return reason;
    }

    private static HttpStatus mapStatus(String reason) {
        if (reason == null) {
            return HttpStatus.BAD_GATEWAY;
        }
        return switch (reason) {
            case "quotaExceeded", "rateLimitExceeded" -> HttpStatus.SERVICE_UNAVAILABLE;
            case "playlistNotFound", "videoNotFound" -> HttpStatus.NOT_FOUND;
            case "invalidKey", "badRequest", "invalidPlaylistId" -> HttpStatus.BAD_GATEWAY;
            default -> HttpStatus.BAD_GATEWAY;
        };
    }
}
