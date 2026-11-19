-- YouDemy initial schema. All user-owned data is keyed by user_id; shared
-- YouTube metadata lives in playlists/videos and is safe to reuse.

CREATE TABLE users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_users_email ON users (lower(email));

CREATE TABLE playlists (
    id                   UUID PRIMARY KEY,
    youtube_playlist_id  VARCHAR(128) NOT NULL,
    title                VARCHAR(512) NOT NULL,
    description          TEXT,
    thumbnail_url        VARCHAR(2048),
    channel_title        VARCHAR(512),
    total_videos         INTEGER NOT NULL DEFAULT 0,
    last_synced_at       TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_playlists_youtube_id ON playlists (youtube_playlist_id);

CREATE TABLE videos (
    id               UUID PRIMARY KEY,
    playlist_id      UUID NOT NULL REFERENCES playlists (id) ON DELETE CASCADE,
    youtube_video_id VARCHAR(64) NOT NULL,
    title            VARCHAR(512) NOT NULL,
    description      TEXT,
    thumbnail_url    VARCHAR(2048),
    duration         VARCHAR(32),
    position         INTEGER NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_videos_playlist_video UNIQUE (playlist_id, youtube_video_id)
);
CREATE INDEX ix_videos_playlist_position ON videos (playlist_id, position);

CREATE TABLE user_playlists (
    id                    UUID PRIMARY KEY,
    user_id               UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    playlist_id           UUID NOT NULL REFERENCES playlists (id) ON DELETE CASCADE,
    last_watched_video_id UUID REFERENCES videos (id) ON DELETE SET NULL,
    last_accessed_at      TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_user_playlists_user_playlist UNIQUE (user_id, playlist_id)
);
CREATE INDEX ix_user_playlists_user_accessed ON user_playlists (user_id, last_accessed_at DESC);

CREATE TABLE user_video_progress (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    video_id     UUID NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_progress_user_video UNIQUE (user_id, video_id)
);
CREATE INDEX ix_progress_user_completed ON user_video_progress (user_id, is_completed);

CREATE TABLE notes (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    video_id   UUID NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
    content    TEXT NOT NULL DEFAULT '',
    version    BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_notes_user_video UNIQUE (user_id, video_id)
);
CREATE INDEX ix_notes_user_video ON notes (user_id, video_id);
