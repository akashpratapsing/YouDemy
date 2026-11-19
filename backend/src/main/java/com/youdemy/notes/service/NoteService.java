package com.youdemy.notes.service;

import com.youdemy.common.exception.ConflictException;
import com.youdemy.notes.dto.NoteDto;
import com.youdemy.notes.dto.SaveNoteRequest;
import com.youdemy.notes.entity.NoteEntity;
import com.youdemy.notes.repository.NoteRepository;
import com.youdemy.playlist.service.PlaylistAccessService;
import com.youdemy.user.repository.UserRepository;
import com.youdemy.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final PlaylistAccessService accessService;
    private final UserRepository userRepository;
    private final VideoRepository videoRepository;

    public NoteDto getNote(UUID userId, UUID videoId) {
        accessService.requireOwnedVideo(userId, videoId);
        return noteRepository.findByUserIdAndVideoId(userId, videoId)
                .map(note -> new NoteDto(note.getContent(), note.getVersion(), note.getUpdatedAt()))
                .orElse(NoteDto.EMPTY);
    }

    @Transactional
    public NoteDto saveNote(UUID userId, UUID videoId, SaveNoteRequest request) {
        accessService.requireOwnedVideo(userId, videoId);
        String content = request.content() == null ? "" : request.content();
        NoteEntity existing = noteRepository.findByUserIdAndVideoId(userId, videoId).orElse(null);

        if (isBlankContent(content)) {
            if (existing != null) {
                verifyVersion(existing, request.version());
                noteRepository.delete(existing);
            }
            return NoteDto.EMPTY;
        }

        try {
            NoteEntity note;
            if (existing == null) {
                if (request.version() != null && request.version() != 0) {
                    throw new ConflictException("This note was changed elsewhere. Refresh and try again.");
                }
                note = new NoteEntity();
                note.setUser(userRepository.getReferenceById(userId));
                note.setVideo(videoRepository.getReferenceById(videoId));
                note.setContent(content);
            } else {
                verifyVersion(existing, request.version());
                note = existing;
                note.setContent(content);
            }
            NoteEntity saved = noteRepository.saveAndFlush(note);
            return new NoteDto(saved.getContent(), saved.getVersion(), saved.getUpdatedAt());
        } catch (OptimisticLockingFailureException ex) {
            throw new ConflictException("This note was changed elsewhere. Refresh and try again.");
        }
    }

    private void verifyVersion(NoteEntity note, Long expectedVersion) {
        if (expectedVersion != null && !expectedVersion.equals(note.getVersion())) {
            throw new ConflictException("This note was changed elsewhere. Refresh and try again.");
        }
    }

    private boolean isBlankContent(String html) {
        return html.replaceAll("<[^>]*>", "").replace("&nbsp;", " ").trim().isEmpty();
    }
}
