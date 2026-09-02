ALTER TABLE current_videos
  ADD COLUMN IF NOT EXISTS channel_id TEXT,
  ADD COLUMN IF NOT EXISTS channel_avatar TEXT;
