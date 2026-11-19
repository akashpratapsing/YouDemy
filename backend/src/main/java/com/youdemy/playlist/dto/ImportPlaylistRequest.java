package com.youdemy.playlist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ImportPlaylistRequest(
        @NotBlank(message = "A YouTube playlist URL is required.")
        @Size(max = 2048, message = "The URL is too long.")
        String url
) {
}
