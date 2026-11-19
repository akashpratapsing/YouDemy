package com.youdemy.playlist.service;

import com.youdemy.common.exception.ResourceNotFoundException;
import com.youdemy.playlist.dto.PlaylistSummaryDto;
import com.youdemy.playlist.repository.UserPlaylistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlaylistQueryService {

    private final UserPlaylistRepository userPlaylistRepository;

    public List<PlaylistSummaryDto> listForUser(UUID userId) {
        return userPlaylistRepository.findSummariesByUser(userId).stream()
                .map(PlaylistSummaryDto::from)
                .toList();
    }

    public PlaylistSummaryDto getSummary(UUID userId, UUID playlistId) {
        return userPlaylistRepository.findSummaryByUserAndPlaylist(userId, playlistId)
                .map(PlaylistSummaryDto::from)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found in your library."));
    }

    public List<PlaylistSummaryDto> recentlyWatched(UUID userId) {
        return listForUser(userId).stream()
                .filter(playlist -> playlist.lastAccessedAt() != null)
                .sorted(Comparator.comparing(PlaylistSummaryDto::lastAccessedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }
}
