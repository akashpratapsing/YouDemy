package com.youdemy.playlist;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youdemy.common.exception.YouTubeApiException;
import com.youdemy.youtube.YouTubeApiClient;
import com.youdemy.youtube.dto.YouTubePlaylistInfo;
import com.youdemy.youtube.dto.YouTubeVideoItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PlaylistIntegrationTest {

    private static final String PLAYLIST_ID = "PLabcdefghijklmnop";
    private static final String URL = "https://www.youtube.com/playlist?list=" + PLAYLIST_ID;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private YouTubeApiClient youTubeApiClient;

    @BeforeEach
    void stubYouTube() {
        when(youTubeApiClient.fetchPlaylistInfo(PLAYLIST_ID)).thenReturn(new YouTubePlaylistInfo(
                PLAYLIST_ID, "Learn Java", "A Java course", "https://img/thumb.jpg", "Code Academy"));
        when(youTubeApiClient.fetchPlaylistVideos(PLAYLIST_ID)).thenReturn(List.of(
                new YouTubeVideoItem("vid0000001", "Intro", "First video", "https://img/1.jpg", 0),
                new YouTubeVideoItem("vid0000002", "OOP", "Second video", "https://img/2.jpg", 1)));
        when(youTubeApiClient.fetchDurations(anyList())).thenReturn(Map.of(
                "vid0000001", "PT10M", "vid0000002", "PT20M30S"));
    }

    @Test
    void importsPlaylistFetchesApiOnceAndReusesForDuplicateAndOtherUsers() throws Exception {
        String alice = register("alice-import@example.com");
        String bob = register("bob-import@example.com");

        JsonNode first = importPlaylist(alice);
        assertThat(first.path("alreadyImported").asBoolean()).isFalse();
        assertThat(first.path("playlist").path("totalVideos").asInt()).isEqualTo(2);
        assertThat(first.path("playlist").path("title").asText()).isEqualTo("Learn Java");
        verify(youTubeApiClient, times(1)).fetchPlaylistInfo(PLAYLIST_ID);

        JsonNode duplicate = importPlaylist(alice);
        assertThat(duplicate.path("alreadyImported").asBoolean()).isTrue();
        verify(youTubeApiClient, times(1)).fetchPlaylistInfo(PLAYLIST_ID);

        JsonNode secondUser = importPlaylist(bob);
        assertThat(secondUser.path("alreadyImported").asBoolean()).isFalse();
        verify(youTubeApiClient, times(1)).fetchPlaylistInfo(PLAYLIST_ID);

        String playlistId = first.path("playlist").path("id").asText();
        mockMvc.perform(get("/api/playlists/{id}", playlistId).header("Authorization", bearer(bob)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completedVideos").value(0));
    }

    @Test
    void progressAndCompletionAreIsolatedPerUserAndIdempotent() throws Exception {
        String alice = register("alice-progress@example.com");
        String bob = register("bob-progress@example.com");
        JsonNode imported = importPlaylist(alice);
        String playlistId = imported.path("playlist").path("id").asText();
        importPlaylist(bob);

        JsonNode videos = getJson(get("/api/playlists/{id}/videos", playlistId)
                .header("Authorization", bearer(alice)));
        String firstVideo = videos.path("data").path("content").get(0).path("id").asText();

        mockMvc.perform(post("/api/videos/{id}/complete", firstVideo).header("Authorization", bearer(alice)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/videos/{id}/complete", firstVideo).header("Authorization", bearer(alice)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/playlists/{id}/progress", playlistId).header("Authorization", bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completedVideos").value(1))
                .andExpect(jsonPath("$.data.completionPercentage").value(50.0));
        mockMvc.perform(get("/api/playlists/{id}/progress", playlistId).header("Authorization", bearer(bob)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completedVideos").value(0))
                .andExpect(jsonPath("$.data.completionPercentage").value(0.0));

        mockMvc.perform(post("/api/videos/{id}/uncomplete", firstVideo).header("Authorization", bearer(alice)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/videos/{id}/uncomplete", firstVideo).header("Authorization", bearer(alice)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/playlists/{id}/progress", playlistId).header("Authorization", bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completedVideos").value(0));
    }

    @Test
    void notesAreUpsertedVersionedAndIsolated() throws Exception {
        String alice = register("alice-notes@example.com");
        String bob = register("bob-notes@example.com");
        JsonNode imported = importPlaylist(alice);
        String playlistId = imported.path("playlist").path("id").asText();
        importPlaylist(bob);

        JsonNode videos = getJson(get("/api/playlists/{id}/videos", playlistId)
                .header("Authorization", bearer(alice)));
        String videoId = videos.path("data").path("content").get(0).path("id").asText();

        JsonNode created = putNote(alice, videoId, "<p>Hello <strong>world</strong></p>", null, 200);
        long version = created.path("data").path("version").asLong();
        assertThat(created.path("data").path("content").asText()).contains("Hello");

        JsonNode updated = putNote(alice, videoId, "<p>Updated note</p>", version, 200);
        assertThat(updated.path("data").path("version").asLong()).isGreaterThan(version);

        putNote(alice, videoId, "<p>Stale write</p>", version, 409);

        mockMvc.perform(get("/api/videos/{id}/notes", videoId).header("Authorization", bearer(bob)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value(""));

        JsonNode empty = putNote(alice, videoId, "<p></p>", null, 200);
        assertThat(empty.path("data").path("content").asText()).isEmpty();
        mockMvc.perform(get("/api/videos/{id}/notes", videoId).header("Authorization", bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value(""));
    }

    @Test
    void preventsAccessToAnotherUsersPlaylistAndVideo() throws Exception {
        String alice = register("alice-secure@example.com");
        String bob = register("bob-secure@example.com");
        JsonNode imported = importPlaylist(alice);
        String playlistId = imported.path("playlist").path("id").asText();
        JsonNode videos = getJson(get("/api/playlists/{id}/videos", playlistId)
                .header("Authorization", bearer(alice)));
        String videoId = videos.path("data").path("content").get(0).path("id").asText();

        mockMvc.perform(get("/api/playlists/{id}", playlistId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/playlists/{id}/videos", playlistId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/videos/{id}/complete", videoId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/videos/{id}/notes", videoId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/playlists/{id}/remove", playlistId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/playlists/{id}", playlistId).header("Authorization", bearer(alice)))
                .andExpect(status().isOk());
    }

    @Test
    void dashboardReflectsPersistedDataAndLastWatched() throws Exception {
        String alice = register("alice-dashboard@example.com");
        JsonNode imported = importPlaylist(alice);
        String playlistId = imported.path("playlist").path("id").asText();
        JsonNode videos = getJson(get("/api/playlists/{id}/videos", playlistId)
                .header("Authorization", bearer(alice)));
        String videoId = videos.path("data").path("content").get(0).path("id").asText();

        mockMvc.perform(put("/api/playlists/{id}/last-watched", playlistId)
                        .header("Authorization", bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("videoId", videoId))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/videos/{id}/complete", videoId).header("Authorization", bearer(alice)))
                .andExpect(status().isOk());

        JsonNode dashboard = getJson(get("/api/user/dashboard").header("Authorization", bearer(alice)));
        assertThat(dashboard.path("data").path("stats").path("totalPlaylists").asInt()).isEqualTo(1);
        assertThat(dashboard.path("data").path("stats").path("totalVideos").asInt()).isEqualTo(2);
        assertThat(dashboard.path("data").path("stats").path("completedVideos").asInt()).isEqualTo(1);
        assertThat(dashboard.path("data").path("continueLearning")).hasSize(1);
        assertThat(dashboard.path("data").path("recentActivity")).hasSize(1);

        mockMvc.perform(get("/api/user/recently-watched").header("Authorization", bearer(alice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void youtubeApiFailureIsReturnedAsServiceUnavailable() throws Exception {
        String alice = register("alice-failure@example.com");
        when(youTubeApiClient.fetchPlaylistInfo("PLfailing123456"))
                .thenThrow(new YouTubeApiException("Quota exceeded", "quotaExceeded"));

        mockMvc.perform(post("/api/playlists/import")
                        .header("Authorization", bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "url", "https://www.youtube.com/playlist?list=PLfailing123456"))))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("YOUTUBE_API_ERROR"));
    }

    @Test
    void validatesImportUrl() throws Exception {
        String alice = register("alice-validation@example.com");
        mockMvc.perform(post("/api/playlists/import")
                        .header("Authorization", bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("url", "https://example.com/nope"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
        verify(youTubeApiClient, times(0)).fetchPlaylistInfo(anyString());
    }

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "password123"))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }

    private JsonNode importPlaylist(String token) throws Exception {
        return getJson(post("/api/playlists/import")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("url", URL))))
                .path("data");
    }

    private JsonNode putNote(String token, String videoId, String content, Long version, int expectedStatus) throws Exception {
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("content", content);
        body.put("version", version);
        MvcResult result = mockMvc.perform(put("/api/videos/{id}/notes", videoId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode getJson(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request) throws Exception {
        MvcResult result = mockMvc.perform(request).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
