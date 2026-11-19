package com.youdemy.video.controller;

import com.youdemy.common.ApiResponse;
import com.youdemy.common.PagedResponse;
import com.youdemy.playlist.service.PlaylistService;
import com.youdemy.user.service.UserService;
import com.youdemy.video.dto.VideoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/playlists/{playlistId}/videos")
@RequiredArgsConstructor
public class VideoController {

    private final PlaylistService playlistService;
    private final UserService userService;

    @GetMapping
    public ApiResponse<PagedResponse<VideoDto>> videos(
            @PathVariable UUID playlistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size) {
        return ApiResponse.ok(playlistService.getVideos(userService.currentUserId(), playlistId, page, size));
    }
}
