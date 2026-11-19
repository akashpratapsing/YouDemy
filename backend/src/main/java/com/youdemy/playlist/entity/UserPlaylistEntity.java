package com.youdemy.playlist.entity;

import com.youdemy.common.BaseEntity;
import com.youdemy.user.entity.UserEntity;
import com.youdemy.video.entity.VideoEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_playlists", uniqueConstraints = @UniqueConstraint(
        name = "uk_user_playlists_user_playlist", columnNames = {"user_id", "playlist_id"}))
@Getter
@Setter
@NoArgsConstructor
public class UserPlaylistEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private PlaylistEntity playlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_watched_video_id")
    private VideoEntity lastWatchedVideo;

    @Column(name = "last_accessed_at")
    private Instant lastAccessedAt;
}
