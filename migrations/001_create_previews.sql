CREATE TABLE IF NOT EXISTS product_previews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  track_title TEXT,
  track_number INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);