import { Pool } from "pg";
import { env } from "@/lib/config";

let pool: Pool | null = null;

export function getDbPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: env.DATABASE_URL,
            max: 10,
            ssl:
                env.NODE_ENV === "production"
                    ? { rejectUnauthorized: false }
                    : undefined,
        });
    }

    return pool;
}

export async function ensureSchema(): Promise<void> {
    const db = getDbPool();
    await db.query("CREATE EXTENSION IF NOT EXISTS vector");
    await db.query(`
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
    )
  `);

    await db.query(
        "CREATE INDEX IF NOT EXISTS event_chunks_occured_at_idx ON event_chunks (occurred_at DESC)",
    );
}

export type EventChunkInput = {
    sourceType: "slack" | "github" | "gmail" | "support" | "meeting";
    externalId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    author?: string;
    occurredAt?: string;
    metadata?: Record<string, unknown>;
    embedding: number[];
};

export async function upsertEventChunk(input: EventChunkInput): Promise<void> {
    const db = getDbPool();

    await db.query(
        `
      INSERT INTO event_chunks (
        source_type,
        external_id,
        title,
        content,
        source_url,
        author,
        occurred_at,
        metadata,
        embedding
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,($9)::vector)
      ON CONFLICT (source_type, external_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        source_url = EXCLUDED.source_url,
        author = EXCLUDED.author,
        occurred_at = EXCLUDED.occurred_at,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding,
        ingested_at = NOW()
    `,
        [
            input.sourceType,
            input.externalId,
            input.title,
            input.content,
            input.sourceUrl ?? null,
            input.author ?? null,
            input.occurredAt ?? null,
            input.metadata ?? {},
            `[${input.embedding.join(",")}]`,
        ],
    );
}

export type SimilarChunk = {
    id: string;
    source_type: string;
    external_id: string;
    title: string;
    content: string;
    source_url: string | null;
    author: string | null;
    occurred_at: string | null;
    metadata: Record<string, unknown>;
    similarity: number;
};

export async function findSimilarChunks(
    embedding: number[],
    topK: number,
): Promise<SimilarChunk[]> {
    const db = getDbPool();
    const result = await db.query<SimilarChunk>(
        `
      SELECT
        id,
        source_type,
        external_id,
        title,
        content,
        source_url,
        author,
        occurred_at,
        metadata,
        1 - (embedding <=> ($1)::vector) AS similarity
      FROM event_chunks
      ORDER BY embedding <=> ($1)::vector
      LIMIT $2
    `,
        [`[${embedding.join(",")}]`, topK],
    );

    return result.rows;
}

export type SourceStat = {
    source_type: string;
    count: number;
    latest_at: string | null;
};

export async function getSourceStats(): Promise<SourceStat[]> {
    const db = getDbPool();
    const result = await db.query<SourceStat>(`
            SELECT
                source_type,
                COUNT(*)::int AS count,
                MAX(occurred_at) AS latest_at
            FROM event_chunks
            GROUP BY source_type
            ORDER BY count DESC, source_type ASC
        `);

    return result.rows;
}

export async function getCorpusStats(): Promise<{
    totalChunks: number;
    latestIngestedAt: string | null;
}> {
    const db = getDbPool();
    const result = await db.query<{
        total_chunks: string;
        latest_ingested_at: string | null;
    }>(`
            SELECT
                COUNT(*)::int AS total_chunks,
                MAX(ingested_at) AS latest_ingested_at
            FROM event_chunks
        `);

    const row = result.rows[0] ?? { total_chunks: "0", latest_ingested_at: null };

    return {
        totalChunks: Number(row.total_chunks),
        latestIngestedAt: row.latest_ingested_at,
    };
}
