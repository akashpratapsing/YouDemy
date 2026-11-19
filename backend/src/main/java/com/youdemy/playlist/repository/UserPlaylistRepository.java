package com.youdemy.playlist.repository;

import com.youdemy.playlist.dto.PlaylistSummaryProjection;
import com.youdemy.playlist.entity.UserPlaylistEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserPlaylistRepository extends JpaRepository<UserPlaylistEntity, UUID> {

    Optional<UserPlaylistEntity> findByUserIdAndPlaylistId(UUID userId, UUID playlistId);

    boolean existsByUserIdAndPlaylistId(UUID userId, UUID playlistId);

    @Query("""
            select new com.youdemy.playlist.dto.PlaylistSummaryProjection(
                up.id, p.id, p.youtubePlaylistId, p.title, p.description, p.thumbnailUrl,
                p.channelTitle, p.totalVideos,
                (select count(pr.id) from UserVideoProgressEntity pr
                    where pr.user.id = :userId and pr.completed = true and pr.video.playlist.id = p.id),
                up.lastAccessedAt, up.createdAt, up.lastWatchedVideo.id)
            from UserPlaylistEntity up join up.playlist p
            where up.user.id = :userId
            """)
    List<PlaylistSummaryProjection> findSummariesByUser(@Param("userId") UUID userId);

    @Query("""
            select new com.youdemy.playlist.dto.PlaylistSummaryProjection(
                up.id, p.id, p.youtubePlaylistId, p.title, p.description, p.thumbnailUrl,
                p.channelTitle, p.totalVideos,
                (select count(pr.id) from UserVideoProgressEntity pr
                    where pr.user.id = :userId and pr.completed = true and pr.video.playlist.id = p.id),
                up.lastAccessedAt, up.createdAt, up.lastWatchedVideo.id)
            from UserPlaylistEntity up join up.playlist p
            where up.user.id = :userId and up.playlist.id = :playlistId
            """)
    Optional<PlaylistSummaryProjection> findSummaryByUserAndPlaylist(@Param("userId") UUID userId,
                                                                      @Param("playlistId") UUID playlistId);

    @Query("""
            select up from UserPlaylistEntity up
            where up.user.id = :userId
            order by up.lastAccessedAt desc nulls last, up.createdAt desc
            """)
    List<UserPlaylistEntity> findRecentlyAccessed(@Param("userId") UUID userId);

    @Query("""
            select case when count(up) > 0 then true else false end
            from UserPlaylistEntity up
            where up.user.id = :userId
              and up.playlist.id in (select v.playlist.id from VideoEntity v where v.id = :videoId)
            """)
    boolean existsOwnedVideo(@Param("userId") UUID userId, @Param("videoId") UUID videoId);
}
