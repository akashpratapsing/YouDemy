-- UserVideoProgressEntity extends BaseEntity, so Hibernate validation expects
-- created_at on this table. It was omitted from V1; add it without dropping data.
ALTER TABLE user_video_progress
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
