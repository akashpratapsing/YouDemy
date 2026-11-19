package com.youdemy.notes.dto;

import jakarta.validation.constraints.Size;

public record SaveNoteRequest(
        @Size(max = 200_000, message = "The note is too large.")
        String content,

        /** Version of the note the client edited. Null means "create or overwrite". */
        Long version
) {
}
