package com.youdemy.video.entity;

import com.youdemy.common.BaseEntity;
import com.youdemy.playlist.entity.PlaylistEntity;
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

import java.util.UUID;

@Entity
@Table(name = "videos", uniqueConstraints = @UniqueConstraint(
        name = "uk_videos_playlist_video", columnNames = {"playlist_id", "youtube_video_id"}))
@Getter
@Setter
@NoArgsConstructor
public class VideoEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private PlaylistEntity playlist;

    @Column(name = "youtube_video_id", nullable = false, length = 64)
    private String youtubeVideoId;

    @Column(name = "title", nullable = false, length = 512)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "thumbnail_url", length = 2048)
    private String thumbnailUrl;

    @Column(name = "duration", length = 32)
    private String duration;

    @Column(name = "position", nullable = false)
    private int position;
}
