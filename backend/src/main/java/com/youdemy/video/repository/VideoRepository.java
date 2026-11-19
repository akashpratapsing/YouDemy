package com.youdemy.video.repository;

import com.youdemy.video.entity.VideoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VideoRepository extends JpaRepository<VideoEntity, UUID> {

    @Query("select v from VideoEntity v where v.playlist.id = :playlistId order by v.position asc, v.createdAt asc")
    List<VideoEntity> findByPlaylistIdOrderByPosition(@Param("playlistId") UUID playlistId);

    @Query("select v from VideoEntity v where v.playlist.id = :playlistId order by v.position asc, v.createdAt asc")
    Page<VideoEntity> findByPlaylistId(@Param("playlistId") UUID playlistId, Pageable pageable);

    @Query("select v from VideoEntity v where v.playlist.id = :playlistId and v.youtubeVideoId = :youtubeVideoId")
    Optional<VideoEntity> findByYoutubeVideoId(@Param("playlistId") UUID playlistId,
                                               @Param("youtubeVideoId") String youtubeVideoId);

    @Query("select count(v) from VideoEntity v where v.playlist.id = :playlistId")
    long countByPlaylistId(@Param("playlistId") UUID playlistId);
}
