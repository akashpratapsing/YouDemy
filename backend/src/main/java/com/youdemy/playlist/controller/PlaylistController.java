package com.youdemy.playlist.controller;

import com.youdemy.common.ApiResponse;
import com.youdemy.playlist.dto.ImportPlaylistRequest;
import com.youdemy.playlist.dto.ImportPlaylistResponse;
import com.youdemy.playlist.dto.LastWatchedRequest;
import com.youdemy.playlist.dto.PlaylistSummaryDto;
import com.youdemy.playlist.service.PlaylistImportService;
import com.youdemy.playlist.service.PlaylistService;
import com.youdemy.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistImportService importService;
    private final PlaylistService playlistService;
    private final UserService userService;

    @PostMapping("/playlists/import")
    public ResponseEntity<ApiResponse<ImportPlaylistResponse>> importPlaylist(
            @Valid @RequestBody ImportPlaylistRequest request) {
        UUID userId = userService.currentUserId();
        ImportPlaylistResponse result = importService.importPlaylist(userId, request.url());
        String message = result.alreadyImported()
                ? "This playlist is already in your library."
                : "Playlist imported successfully.";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result, message));
    }

    @GetMapping("/user/playlists")
    public ApiResponse<List<PlaylistSummaryDto>> myPlaylists() {
        return ApiResponse.ok(playlistService.listPlaylists(userService.currentUserId()));
    }

    @GetMapping("/playlists/{playlistId}")
    public ApiResponse<PlaylistSummaryDto> getPlaylist(@PathVariable UUID playlistId) {
        return ApiResponse.ok(playlistService.getPlaylist(userService.currentUserId(), playlistId));
    }

    @DeleteMapping("/playlists/{playlistId}/remove")
    public ApiResponse<Void> remove(@PathVariable UUID playlistId) {
        playlistService.removePlaylist(userService.currentUserId(), playlistId);
        return ApiResponse.ok(null, "Playlist removed from your library.");
    }

    @PutMapping("/playlists/{playlistId}/last-watched")
    public ApiResponse<Void> updateLastWatched(@PathVariable UUID playlistId,
                                               @Valid @RequestBody LastWatchedRequest request) {
        playlistService.updateLastWatched(userService.currentUserId(), playlistId, request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/playlists/{playlistId}/resync")
    public ApiResponse<Void> resync(@PathVariable UUID playlistId) {
        playlistService.resync(userService.currentUserId(), playlistId);
        return ApiResponse.ok(null, "Playlist synchronized with YouTube.");
    }
}
