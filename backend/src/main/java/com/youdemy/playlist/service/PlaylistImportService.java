package com.youdemy.playlist.service;

import com.youdemy.playlist.dto.ImportPlaylistResponse;
import com.youdemy.playlist.dto.PlaylistSummaryDto;
import com.youdemy.playlist.entity.PlaylistEntity;
import com.youdemy.playlist.entity.UserPlaylistEntity;
import com.youdemy.playlist.repository.PlaylistRepository;
import com.youdemy.playlist.repository.UserPlaylistRepository;
import com.youdemy.user.repository.UserRepository;
import com.youdemy.video.entity.VideoEntity;
import com.youdemy.video.repository.VideoRepository;
import com.youdemy.youtube.YouTubeService;
import com.youdemy.youtube.YouTubeUrlParser;
import com.youdemy.youtube.dto.YouTubeImportResult;
import com.youdemy.youtube.dto.YouTubePlaylistInfo;
import com.youdemy.youtube.dto.YouTubeVideoItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
public class PlaylistImportService {

    private final YouTubeUrlParser urlParser;
    private final YouTubeService youTubeService;
    private final PlaylistRepository playlistRepository;
    private final UserPlaylistRepository userPlaylistRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final PlaylistQueryService playlistQueryService;
    private final TransactionTemplate transactionTemplate;
    private final ConcurrentHashMap<String, ReentrantLock> locks = new ConcurrentHashMap<>();

    public PlaylistImportService(YouTubeUrlParser urlParser, YouTubeService youTubeService,
                                 PlaylistRepository playlistRepository,
                                 UserPlaylistRepository userPlaylistRepository,
                                 VideoRepository videoRepository, UserRepository userRepository,
                                 PlaylistQueryService playlistQueryService,
                                 PlatformTransactionManager transactionManager) {
        this.urlParser = urlParser;
        this.youTubeService = youTubeService;
        this.playlistRepository = playlistRepository;
        this.userPlaylistRepository = userPlaylistRepository;
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.playlistQueryService = playlistQueryService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /**
     * Imports a playlist for the given user. Shared metadata is fetched only once: a second user
     * (or a duplicate import by the same user) reuses the persisted playlist without an API call.
     */
    public ImportPlaylistResponse importPlaylist(UUID userId, String url) {
        String youtubePlaylistId = urlParser.parse(url);
        ReentrantLock lock = locks.computeIfAbsent(youtubePlaylistId, ignored -> new ReentrantLock());
        lock.lock();
        try {
            // The lock is held until the transaction commits so a concurrent import cannot race.
            return transactionTemplate.execute(status -> doImport(userId, youtubePlaylistId));
        } finally {
            lock.unlock();
            locks.remove(youtubePlaylistId, lock);
        }
    }

    private ImportPlaylistResponse doImport(UUID userId, String youtubePlaylistId) {
        PlaylistEntity playlist = playlistRepository.findByYoutubePlaylistId(youtubePlaylistId).orElse(null);
        boolean alreadyImported = false;

        if (playlist == null) {
            log.info("Fetching playlist {} from YouTube API", youtubePlaylistId);
            YouTubeImportResult result = youTubeService.fetchPlaylist(youtubePlaylistId);
            playlist = persistPlaylist(result);
        } else {
            log.debug("Reusing persisted metadata for playlist {}", youtubePlaylistId);
        }

        if (userPlaylistRepository.existsByUserIdAndPlaylistId(userId, playlist.getId())) {
            alreadyImported = true;
        } else {
            createAssociation(userId, playlist);
        }
        return new ImportPlaylistResponse(summary(userId, playlist), alreadyImported);
    }

    private PlaylistEntity persistPlaylist(YouTubeImportResult result) {
        YouTubePlaylistInfo info = result.playlist();
        PlaylistEntity playlist = new PlaylistEntity();
        playlist.setYoutubePlaylistId(info.youtubeId());
        playlist.setTitle(info.title());
        playlist.setDescription(info.description());
        playlist.setThumbnailUrl(info.thumbnailUrl());
        playlist.setChannelTitle(info.channelTitle());
        playlist.setTotalVideos(result.videos().size());
        playlist.setLastSyncedAt(Instant.now());
        PlaylistEntity savedPlaylist = playlistRepository.save(playlist);

        Map<String, YouTubeVideoItem> unique = new LinkedHashMap<>();
        for (YouTubeVideoItem video : result.videos()) {
            unique.putIfAbsent(video.videoId(), video);
        }
        List<VideoEntity> videos = unique.values().stream().map(item -> {
            VideoEntity video = new VideoEntity();
            video.setPlaylist(savedPlaylist);
            video.setYoutubeVideoId(item.videoId());
            video.setTitle(item.title());
            video.setDescription(item.description());
            video.setThumbnailUrl(item.thumbnailUrl());
            video.setDuration(result.durationsByVideoId().get(item.videoId()));
            video.setPosition(item.position());
            return video;
        }).toList();
        videoRepository.saveAll(videos);
        savedPlaylist.setTotalVideos(videos.size());
        return savedPlaylist;
    }

    private void createAssociation(UUID userId, PlaylistEntity playlist) {
        UserPlaylistEntity association = new UserPlaylistEntity();
        association.setUser(userRepository.getReferenceById(userId));
        association.setPlaylist(playlist);
        association.setLastAccessedAt(Instant.now());
        userPlaylistRepository.save(association);
    }

    private PlaylistSummaryDto summary(UUID userId, PlaylistEntity playlist) {
        return playlistQueryService.getSummary(userId, playlist.getId());
    }
}
