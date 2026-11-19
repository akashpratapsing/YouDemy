package com.youdemy.playlist.repository;

import com.youdemy.playlist.entity.PlaylistEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlaylistRepository extends JpaRepository<PlaylistEntity, UUID> {
    Optional<PlaylistEntity> findByYoutubePlaylistId(String youtubePlaylistId);
}
