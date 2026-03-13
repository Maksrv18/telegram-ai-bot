-- database/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  is_premium BOOLEAN DEFAULT 0,
  stars_balance INTEGER DEFAULT 0,
  requests_today INTEGER DEFAULT 0,
  requests_this_hour INTEGER DEFAULT 0,
  requests_total INTEGER DEFAULT 0,
  last_request_at DATETIME,
  last_hour_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_day_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(telegram_id),
  type TEXT NOT NULL, -- 'image', 'video', 'upscale', 'removebg', 'chat'
  model TEXT NOT NULL,
  prompt TEXT,
  input_url TEXT,
  output_urls TEXT, -- JSON array
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'done', 'failed'
  error_message TEXT,
  prediction_id TEXT,
  processing_time INTEGER, -- milliseconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(telegram_id),
  preferred_model TEXT DEFAULT 'flux_schnell',
  preferred_ratio TEXT DEFAULT '1:1',
  notify_on_complete BOOLEAN DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER REFERENCES users(telegram_id),
  charge_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
