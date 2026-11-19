package com.youdemy.progress.controller;

import com.youdemy.common.ApiResponse;
import com.youdemy.playlist.service.PlaylistAccessService;
import com.youdemy.progress.dto.ProgressDto;
import com.youdemy.progress.service.ProgressService;
import com.youdemy.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final PlaylistAccessService accessService;
    private final UserService userService;

    @PostMapping("/videos/{videoId}/complete")
    public ResponseEntity<ApiResponse<Void>> complete(@PathVariable UUID videoId) {
        progressService.markComplete(userService.currentUserId(), videoId);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.ok(null, "Video marked as completed."));
    }

    @PostMapping("/videos/{videoId}/uncomplete")
    public ResponseEntity<ApiResponse<Void>> uncomplete(@PathVariable UUID videoId) {
        progressService.markUncomplete(userService.currentUserId(), videoId);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.ok(null, "Video marked as incomplete."));
    }

    @GetMapping("/playlists/{playlistId}/progress")
    public ApiResponse<ProgressDto> progress(@PathVariable UUID playlistId) {
        UUID userId = userService.currentUserId();
        accessService.requireOwnedPlaylist(userId, playlistId);
        return ApiResponse.ok(progressService.getPlaylistProgress(userId, playlistId));
    }
}
