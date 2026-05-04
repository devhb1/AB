CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS event_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  author TEXT,
  occurred_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(1536) NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, external_id)
);

CREATE INDEX IF NOT EXISTS event_chunks_occurred_at_idx ON event_chunks (occurred_at DESC);
