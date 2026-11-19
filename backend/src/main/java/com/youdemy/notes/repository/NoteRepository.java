package com.youdemy.notes.repository;

import com.youdemy.notes.entity.NoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<NoteEntity, UUID> {
    Optional<NoteEntity> findByUserIdAndVideoId(UUID userId, UUID videoId);
}
