package com.youdemy.playlist.entity;

import com.youdemy.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "playlists")
@Getter
@Setter
@NoArgsConstructor
public class PlaylistEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "youtube_playlist_id", nullable = false, unique = true, length = 128)
    private String youtubePlaylistId;

    @Column(name = "title", nullable = false, length = 512)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "thumbnail_url", length = 2048)
    private String thumbnailUrl;

    @Column(name = "channel_title", length = 512)
    private String channelTitle;

    @Column(name = "total_videos", nullable = false)
    private int totalVideos;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;
}
