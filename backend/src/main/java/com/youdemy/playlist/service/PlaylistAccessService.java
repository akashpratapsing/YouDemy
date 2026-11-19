package com.youdemy.playlist.service;

import com.youdemy.common.exception.ResourceNotFoundException;
import com.youdemy.playlist.entity.UserPlaylistEntity;
import com.youdemy.playlist.repository.UserPlaylistRepository;
import com.youdemy.video.entity.VideoEntity;
import com.youdemy.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Centralizes IDOR protection: every user-scoped lookup goes through here. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlaylistAccessService {

    private final UserPlaylistRepository userPlaylistRepository;
    private final VideoRepository videoRepository;

    public UserPlaylistEntity requireOwnedPlaylist(UUID userId, UUID playlistId) {
        return userPlaylistRepository.findByUserIdAndPlaylistId(userId, playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found in your library."));
    }

    public void requireOwnedVideo(UUID userId, UUID videoId) {
        if (!userPlaylistRepository.existsOwnedVideo(userId, videoId)) {
            throw new ResourceNotFoundException("Video not found in your library.");
        }
    }

    public VideoEntity requireOwnedVideoEntity(UUID userId, UUID videoId) {
        requireOwnedVideo(userId, videoId);
        return videoRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found."));
    }
}
