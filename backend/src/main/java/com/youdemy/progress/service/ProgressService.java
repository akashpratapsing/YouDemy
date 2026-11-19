package com.youdemy.progress.service;

import com.youdemy.common.exception.ResourceNotFoundException;
import com.youdemy.playlist.service.PlaylistAccessService;
import com.youdemy.progress.dto.ProgressDto;
import com.youdemy.progress.entity.UserVideoProgressEntity;
import com.youdemy.progress.repository.UserVideoProgressRepository;
import com.youdemy.user.repository.UserRepository;
import com.youdemy.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {

    private final PlaylistAccessService accessService;
    private final UserVideoProgressRepository progressRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;

    @Transactional
    public void markComplete(UUID userId, UUID videoId) {
        accessService.requireOwnedVideo(userId, videoId);
        UserVideoProgressEntity progress = progressRepository.findByUserIdAndVideoId(userId, videoId)
                .orElseGet(() -> newProgress(userId, videoId));
        if (!progress.isCompleted()) {
            progress.setCompleted(true);
            progress.setCompletedAt(Instant.now());
            progressRepository.save(progress);
        }
    }

    @Transactional
    public void markUncomplete(UUID userId, UUID videoId) {
        accessService.requireOwnedVideo(userId, videoId);
        progressRepository.findByUserIdAndVideoId(userId, videoId)
                .ifPresent(progressRepository::delete);
    }

    public ProgressDto getPlaylistProgress(UUID userId, UUID playlistId) {
        int total = (int) videoRepository.countByPlaylistId(playlistId);
        long completed = progressRepository.countCompletedByUserAndPlaylist(userId, playlistId);
        return ProgressDto.of(total, (int) completed);
    }

    public boolean isCompleted(UUID userId, UUID videoId) {
        return progressRepository.findByUserIdAndVideoId(userId, videoId)
                .map(UserVideoProgressEntity::isCompleted)
                .orElse(false);
    }

    private UserVideoProgressEntity newProgress(UUID userId, UUID videoId) {
        UserVideoProgressEntity progress = new UserVideoProgressEntity();
        progress.setUser(userRepository.getReferenceById(userId));
        progress.setVideo(videoRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found.")));
        return progress;
    }
}
