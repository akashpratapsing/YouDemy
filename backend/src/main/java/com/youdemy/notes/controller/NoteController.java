package com.youdemy.notes.controller;

import com.youdemy.common.ApiResponse;
import com.youdemy.notes.dto.NoteDto;
import com.youdemy.notes.dto.SaveNoteRequest;
import com.youdemy.notes.service.NoteService;
import com.youdemy.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/videos/{videoId}/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final UserService userService;

    @GetMapping
    public ApiResponse<NoteDto> get(@PathVariable UUID videoId) {
        return ApiResponse.ok(noteService.getNote(userService.currentUserId(), videoId));
    }

    @PutMapping
    public ApiResponse<NoteDto> save(@PathVariable UUID videoId, @Valid @RequestBody SaveNoteRequest request) {
        return ApiResponse.ok(noteService.saveNote(userService.currentUserId(), videoId, request), "Note saved.");
    }
}
