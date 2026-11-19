package com.youdemy.youtube;

import com.youdemy.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class YouTubeUrlParserTest {

    private final YouTubeUrlParser parser = new YouTubeUrlParser();

    @Test
    void parsesPlaylistWatchAndShortUrls() {
        assertThat(parser.parse("https://www.youtube.com/playlist?list=PLabcdefghijklmnop")).isEqualTo("PLabcdefghijklmnop");
        assertThat(parser.parse("https://www.youtube.com/watch?v=abc123&list=PLabcdefghijklmnop&index=2"))
                .isEqualTo("PLabcdefghijklmnop");
        assertThat(parser.parse("https://youtu.be/abc123?list=PLabcdefghijklmnop")).isEqualTo("PLabcdefghijklmnop");
        assertThat(parser.parse("https://m.youtube.com/playlist?list=UUabcdefghijklmnop")).isEqualTo("UUabcdefghijklmnop");
        assertThat(parser.parse("PLabcdefghijklmnop")).isEqualTo("PLabcdefghijklmnop");
    }

    @Test
    void rejectsUrlsWithoutPlaylistId() {
        assertThatThrownBy(() -> parser.parse("https://www.youtube.com/watch?v=abc123"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("playlist ID");
        assertThatThrownBy(() -> parser.parse("https://www.youtube.com/playlist?list=x"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsInvalidAndNonYouTubeUrls() {
        assertThatThrownBy(() -> parser.parse(""))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("playlist URL");
        assertThatThrownBy(() -> parser.parse("https://example.com/playlist?list=PLabcdefghijklmnop"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("youtube.com");
        assertThatThrownBy(() -> parser.parse("not a url at all"))
                .isInstanceOf(BadRequestException.class);
    }
}
