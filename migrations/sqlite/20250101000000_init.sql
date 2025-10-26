-- Initial schema for local RAG application

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  settings_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  title TEXT,
  mime TEXT,
  bytes INTEGER,
  status TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  text TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  start_char INTEGER,
  end_char INTEGER
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  settings_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  meta_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL,
  doc_id TEXT,
  chunk_id TEXT,
  url TEXT,
  snapshot_path TEXT,
  score REAL,
  start_char INTEGER,
  end_char INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_docs_collection ON documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_docs_sha256 ON documents(collection_id, sha256);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_msgs_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_citations_msg ON citations(message_id);
CREATE INDEX IF NOT EXISTS idx_conversations_collection ON conversations(collection_id);
