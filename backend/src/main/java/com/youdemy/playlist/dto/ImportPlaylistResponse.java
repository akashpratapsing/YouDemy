package com.youdemy.playlist.dto;

public record ImportPlaylistResponse(PlaylistSummaryDto playlist, boolean alreadyImported) {
}
