package com.youdemy.progress.repository;

import com.youdemy.progress.dto.CompletedVideoProjection;
import com.youdemy.progress.entity.UserVideoProgressEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserVideoProgressRepository extends JpaRepository<UserVideoProgressEntity, UUID> {

    Optional<UserVideoProgressEntity> findByUserIdAndVideoId(UUID userId, UUID videoId);

    @Query("""
            select count(p) from UserVideoProgressEntity p
            where p.user.id = :userId and p.completed = true and p.video.playlist.id = :playlistId
            """)
    long countCompletedByUserAndPlaylist(@Param("userId") UUID userId, @Param("playlistId") UUID playlistId);

    @Query("""
            select count(p) from UserVideoProgressEntity p
            where p.user.id = :userId and p.completed = true
            """)
    long countCompletedByUser(@Param("userId") UUID userId);

    @Query("""
            select p.video.id from UserVideoProgressEntity p
            where p.user.id = :userId and p.completed = true and p.video.playlist.id = :playlistId
            """)
    List<UUID> findCompletedVideoIds(@Param("userId") UUID userId, @Param("playlistId") UUID playlistId);

    @Query("""
            select new com.youdemy.progress.dto.CompletedVideoProjection(
                p.video.id, p.video.title, p.video.playlist.id, p.video.playlist.title,
                p.video.thumbnailUrl, p.completedAt)
            from UserVideoProgressEntity p
            where p.user.id = :userId and p.completed = true
            order by p.completedAt desc
            """)
    List<CompletedVideoProjection> findRecentCompleted(@Param("userId") UUID userId, Pageable pageable);
}
