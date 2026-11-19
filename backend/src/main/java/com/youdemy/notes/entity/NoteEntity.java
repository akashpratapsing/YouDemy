package com.youdemy.notes.entity;

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
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notes", uniqueConstraints = @UniqueConstraint(
        name = "uk_notes_user_video", columnNames = {"user_id", "video_id"}))
@Getter
@Setter
@NoArgsConstructor
public class NoteEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "video_id", nullable = false)
    private VideoEntity video;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    /** Optimistic lock used to reject stale debounced autosaves. */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
