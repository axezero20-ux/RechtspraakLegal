/* Add pinned column to matter_uploads for pinning important documents */
ALTER TABLE matter_uploads ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_matter_uploads_pinned ON matter_uploads(matter_id, pinned);
