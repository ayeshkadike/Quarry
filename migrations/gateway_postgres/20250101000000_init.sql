-- Gateway database schema for quotas and usage tracking

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  web_queries_day INTEGER NOT NULL,
  gen_tokens_day BIGINT NOT NULL,
  rpm INTEGER NOT NULL DEFAULT 60,
  tpm INTEGER NOT NULL DEFAULT 30000
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  api_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_counters (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  web_queries INTEGER NOT NULL DEFAULT 0,
  gen_tokens BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, day)
);

-- Insert default plans
INSERT INTO plans (id, name, web_queries_day, gen_tokens_day, rpm, tpm) VALUES
  ('free', 'Free', 10, 5000, 10, 5000),
  ('pro', 'Pro', 500, 100000, 60, 30000),
  ('teams', 'Teams', 5000, 500000, 120, 100000)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_usage_user_day ON usage_counters(user_id, day);
