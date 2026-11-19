package com.youdemy.dashboard.service;

import com.youdemy.dashboard.dto.ContinueLearningDto;
import com.youdemy.dashboard.dto.DashboardDto;
import com.youdemy.dashboard.dto.DashboardStatsDto;
import com.youdemy.dashboard.dto.LearningActivityDto;
import com.youdemy.playlist.dto.PlaylistSummaryDto;
import com.youdemy.playlist.entity.UserPlaylistEntity;
import com.youdemy.playlist.repository.UserPlaylistRepository;
import com.youdemy.playlist.service.PlaylistQueryService;
import com.youdemy.progress.dto.CompletedVideoProjection;
import com.youdemy.progress.repository.UserVideoProgressRepository;
import com.youdemy.video.entity.VideoEntity;
import com.youdemy.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final PlaylistQueryService playlistQueryService;
    private final UserPlaylistRepository userPlaylistRepository;
    private final VideoRepository videoRepository;
    private final UserVideoProgressRepository progressRepository;

    public DashboardDto getDashboard(UUID userId) {
        List<PlaylistSummaryDto> summaries = playlistQueryService.listForUser(userId);
        int totalVideos = summaries.stream().mapToInt(PlaylistSummaryDto::totalVideos).sum();
        int completedVideos = summaries.stream().mapToInt(PlaylistSummaryDto::completedVideos).sum();
        double overall = totalVideos == 0 ? 0.0
                : Math.round(completedVideos * 1000.0 / totalVideos) / 10.0;

        DashboardStatsDto stats = new DashboardStatsDto(
                summaries.size(), totalVideos, completedVideos, totalVideos - completedVideos, overall);

        List<PlaylistSummaryDto> recent = summaries.stream()
                .filter(playlist -> playlist.lastAccessedAt() != null)
                .sorted(Comparator.comparing(PlaylistSummaryDto::lastAccessedAt).reversed())
                .limit(4)
                .toList();

        Map<UUID, PlaylistSummaryDto> summaryByPlaylistId = summaries.stream()
                .collect(Collectors.toMap(PlaylistSummaryDto::id, Function.identity()));
        List<ContinueLearningDto> continueLearning = userPlaylistRepository.findRecentlyAccessed(userId).stream()
                .filter(association -> association.getLastWatchedVideo() != null)
                .filter(association -> {
                    PlaylistSummaryDto summary = summaryByPlaylistId.get(association.getPlaylist().getId());
                    return summary != null && !summary.completed();
                })
                .limit(4)
                .map(association -> toContinueLearning(userId, association, summaryByPlaylistId))
                .toList();

        List<LearningActivityDto> activity = progressRepository
                .findRecentCompleted(userId, PageRequest.of(0, 8)).stream()
                .map(this::toActivity)
                .toList();

        return new DashboardDto(stats, recent, continueLearning, activity);
    }

    public List<PlaylistSummaryDto> recentlyWatched(UUID userId) {
        return playlistQueryService.recentlyWatched(userId);
    }

    public List<LearningActivityDto> completedVideos(UUID userId) {
        return progressRepository.findRecentCompleted(userId, PageRequest.of(0, 100)).stream()
                .map(this::toActivity)
                .toList();
    }

    private ContinueLearningDto toContinueLearning(UUID userId, UserPlaylistEntity association,
                                                   Map<UUID, PlaylistSummaryDto> summaries) {
        UUID playlistId = association.getPlaylist().getId();
        List<VideoEntity> videos = videoRepository.findByPlaylistIdOrderByPosition(playlistId);
        HashSet<UUID> completed = new HashSet<>(progressRepository.findCompletedVideoIds(userId, playlistId));
        VideoEntity last = association.getLastWatchedVideo();

        VideoEntity next = videos.stream()
                .filter(video -> !completed.contains(video.getId()) && video.getPosition() > last.getPosition())
                .findFirst()
                .orElseGet(() -> videos.stream()
                        .filter(video -> !completed.contains(video.getId()))
                        .findFirst()
                        .orElse(last));

        PlaylistSummaryDto summary = summaries.get(playlistId);
        return new ContinueLearningDto(
                playlistId,
                association.getPlaylist().getTitle(),
                association.getPlaylist().getThumbnailUrl(),
                next.getId(),
                next.getTitle(),
                next.getThumbnailUrl(),
                summary.completedVideos(),
                summary.totalVideos(),
                summary.completionPercentage()
        );
    }

    private LearningActivityDto toActivity(CompletedVideoProjection projection) {
        return new LearningActivityDto(
                projection.videoId(), projection.videoTitle(), projection.playlistId(),
                projection.playlistTitle(), projection.thumbnailUrl(), projection.completedAt());
    }
}
