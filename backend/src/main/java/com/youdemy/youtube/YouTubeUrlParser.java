package com.youdemy.youtube;

import com.youdemy.common.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Safely extracts a YouTube playlist id from the URL formats users actually paste. */
@Component
public class YouTubeUrlParser {

    private static final Pattern PLAYLIST_ID = Pattern.compile("^[A-Za-z0-9_-]{10,128}$");
    private static final Pattern BARE_ID = Pattern.compile("^[A-Za-z0-9_-]{10,128}$");

    public String parse(String input) {
        if (input == null || input.isBlank()) {
            throw new BadRequestException("Please paste a YouTube playlist URL.");
        }

        String value = input.trim();
        if (!value.contains("://") && !value.startsWith("www.") && BARE_ID.matcher(value).matches()) {
            return value;
        }

        URI uri;
        try {
            uri = URI.create(value.startsWith("http://") || value.startsWith("https://")
                    ? value : "https://" + value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("That URL could not be parsed. Please check it and try again.");
        }

        String host = normalizeHost(uri.getHost());
        Map<String, String> query = parseQuery(uri.getRawQuery());
        String listId = query.get("list");

        if (!isYouTubeHost(host)) {
            throw new BadRequestException("Please paste a valid youtube.com or youtu.be playlist URL.");
        }
        if (listId == null || !PLAYLIST_ID.matcher(listId).matches()) {
            throw new BadRequestException("No valid playlist ID was found. The URL must contain a list= parameter.");
        }

        String path = uri.getPath() == null ? "" : uri.getPath().toLowerCase(Locale.ROOT);
        boolean knownPlaylistPath = path.startsWith("/playlist")
                || path.startsWith("/watch")
                || path.startsWith("/shorts/")
                || "youtu.be".equals(host);
        if (!knownPlaylistPath) {
            throw new BadRequestException("This YouTube URL format is not supported. Use a playlist or watch URL with list=.");
        }
        return listId;
    }

    private boolean isYouTubeHost(String host) {
        return "youtube.com".equals(host) || "youtu.be".equals(host);
    }

    private String normalizeHost(String host) {
        if (host == null) {
            return "";
        }
        String normalized = host.toLowerCase(Locale.ROOT);
        if (normalized.startsWith("www.")) {
            normalized = normalized.substring(4);
        }
        if (normalized.startsWith("m.") || normalized.startsWith("music.")) {
            normalized = normalized.substring(2);
        }
        return normalized;
    }

    private Map<String, String> parseQuery(String rawQuery) {
        Map<String, String> params = new LinkedHashMap<>();
        if (rawQuery == null || rawQuery.isBlank()) {
            return params;
        }
        for (String pair : rawQuery.split("&")) {
            int separator = pair.indexOf('=');
            if (separator < 0) {
                continue;
            }
            try {
                String key = URLDecoder.decode(pair.substring(0, separator), StandardCharsets.UTF_8);
                String value = URLDecoder.decode(pair.substring(separator + 1), StandardCharsets.UTF_8);
                params.putIfAbsent(key, value);
            } catch (IllegalArgumentException ignored) {
                // Ignore a malformed query parameter; validation below still catches a missing list ID.
            }
        }
        return params;
    }
}
