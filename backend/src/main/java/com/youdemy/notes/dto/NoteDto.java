package com.youdemy.notes.dto;

import java.time.Instant;

public record NoteDto(String content, long version, Instant updatedAt) {
    public static final NoteDto EMPTY = new NoteDto("", 0, null);
}
