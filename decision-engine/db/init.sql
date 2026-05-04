CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS event_chunks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user',
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
  UNIQUE (user_id, source_type, external_id)
);

CREATE TABLE IF NOT EXISTS cross_links (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user',
  source_chunk_id BIGINT NOT NULL REFERENCES event_chunks(id) ON DELETE CASCADE,
  target_chunk_id BIGINT NOT NULL REFERENCES event_chunks(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  similarity DOUBLE PRECISION NOT NULL,
  explanation TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_chunk_id, target_chunk_id, link_type)
);

CREATE INDEX IF NOT EXISTS cross_links_user_id_idx ON cross_links (user_id);
CREATE INDEX IF NOT EXISTS cross_links_source_chunk_id_idx ON cross_links (source_chunk_id);
CREATE INDEX IF NOT EXISTS cross_links_target_chunk_id_idx ON cross_links (target_chunk_id);

CREATE INDEX IF NOT EXISTS event_chunks_occurred_at_idx ON event_chunks (occurred_at DESC);
