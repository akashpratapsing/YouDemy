package com.youdemy.playlist.service;

import com.youdemy.common.PagedResponse;
import com.youdemy.common.exception.BadRequestException;
import com.youdemy.playlist.dto.LastWatchedRequest;
import com.youdemy.playlist.dto.PlaylistSummaryDto;
import com.youdemy.playlist.entity.UserPlaylistEntity;
import com.youdemy.playlist.repository.UserPlaylistRepository;
import com.youdemy.progress.dto.ProgressDto;
import com.youdemy.progress.repository.UserVideoProgressRepository;
import com.youdemy.video.dto.VideoDto;
import com.youdemy.video.entity.VideoEntity;
import com.youdemy.video.repository.VideoRepository;
import com.youdemy.video.service.VideoMapper;
import com.youdemy.youtube.YouTubeService;
import com.youdemy.youtube.dto.YouTubeImportResult;
import com.youdemy.youtube.dto.YouTubeVideoItem;
import com.youdemy.youtube.dto.YouTubePlaylistInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlaylistService {

    private final PlaylistAccessService accessService;
    private final PlaylistQueryService queryService;
    private final UserPlaylistRepository userPlaylistRepository;
    private final VideoRepository videoRepository;
    private final UserVideoProgressRepository progressRepository;
    private final YouTubeService youTubeService;

    public List<PlaylistSummaryDto> listPlaylists(UUID userId) {
        return queryService.listForUser(userId);
    }

    public PlaylistSummaryDto getPlaylist(UUID userId, UUID playlistId) {
        return queryService.getSummary(userId, playlistId);
    }

    public ProgressDto getProgress(UUID userId, UUID playlistId) {
        UserPlaylistEntity association = accessService.requireOwnedPlaylist(userId, playlistId);
        int total = association.getPlaylist().getTotalVideos();
        long completed = progressRepository.countCompletedByUserAndPlaylist(userId, playlistId);
        return ProgressDto.of(total, (int) completed);
    }

    public PagedResponse<VideoDto> getVideos(UUID userId, UUID playlistId, int page, int size) {
        accessService.requireOwnedPlaylist(userId, playlistId);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 200);
        Page<VideoEntity> videoPage = videoRepository.findByPlaylistId(playlistId, PageRequest.of(safePage, safeSize));
        HashSet<UUID> completed = new HashSet<>(progressRepository.findCompletedVideoIds(userId, playlistId));
        List<VideoDto> content = videoPage.getContent().stream()
                .map(video -> VideoMapper.toDto(video, completed.contains(video.getId())))
                .toList();
        return PagedResponse.of(content, safePage, safeSize, videoPage.getTotalElements());
    }

    @Transactional
    public void removePlaylist(UUID userId, UUID playlistId) {
        UserPlaylistEntity association = accessService.requireOwnedPlaylist(userId, playlistId);
        userPlaylistRepository.delete(association);
    }

    @Transactional
    public void updateLastWatched(UUID userId, UUID playlistId, LastWatchedRequest request) {
        UserPlaylistEntity association = accessService.requireOwnedPlaylist(userId, playlistId);
        VideoEntity video = videoRepository.findById(request.videoId())
                .orElseThrow(() -> new BadRequestException("The selected video does not exist."));
        if (!video.getPlaylist().getId().equals(playlistId)) {
            throw new BadRequestException("The selected video does not belong to this playlist.");
        }
        association.setLastWatchedVideo(video);
        association.setLastAccessedAt(Instant.now());
        userPlaylistRepository.save(association);
    }

    /** Manual resync: refreshes shared metadata without touching per-user progress or notes. */
    @Transactional
    public void resync(UUID userId, UUID playlistId) {
        UserPlaylistEntity association = accessService.requireOwnedPlaylist(userId, playlistId);
        var playlist = association.getPlaylist();
        YouTubeImportResult result = youTubeService.fetchPlaylist(playlist.getYoutubePlaylistId());
        YouTubePlaylistInfo info = result.playlist();

        playlist.setTitle(info.title());
        playlist.setDescription(info.description());
        playlist.setThumbnailUrl(info.thumbnailUrl());
        playlist.setChannelTitle(info.channelTitle());
        playlist.setLastSyncedAt(Instant.now());

        Map<String, VideoEntity> existing = new LinkedHashMap<>();
        videoRepository.findByPlaylistIdOrderByPosition(playlistId)
                .forEach(video -> existing.put(video.getYoutubeVideoId(), video));
        for (YouTubeVideoItem item : result.videos()) {
            VideoEntity video = existing.get(item.videoId());
            if (video == null) {
                video = new VideoEntity();
                video.setPlaylist(playlist);
                video.setYoutubeVideoId(item.videoId());
                existing.put(item.videoId(), video);
            }
            video.setTitle(item.title());
            video.setDescription(item.description());
            video.setThumbnailUrl(item.thumbnailUrl());
            video.setDuration(result.durationsByVideoId().get(item.videoId()));
            video.setPosition(item.position());
        }
        videoRepository.saveAll(existing.values());
        playlist.setTotalVideos(existing.size());
    }
}
