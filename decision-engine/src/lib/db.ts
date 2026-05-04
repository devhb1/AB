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
    )
  `);

    await db.query("ALTER TABLE event_chunks ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'demo-user'");
    await db.query("ALTER TABLE event_chunks ALTER COLUMN user_id SET DEFAULT 'demo-user'");
    await db.query("ALTER TABLE event_chunks DROP CONSTRAINT IF EXISTS event_chunks_source_type_external_id_key");
    await db.query(
        "CREATE UNIQUE INDEX IF NOT EXISTS event_chunks_user_source_external_uidx ON event_chunks (user_id, source_type, external_id)",
    );
    await db.query(
        "CREATE INDEX IF NOT EXISTS event_chunks_user_occurred_at_idx ON event_chunks (user_id, occurred_at DESC)",
    );

    await db.query(`
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
        )
    `);
    await db.query("CREATE INDEX IF NOT EXISTS cross_links_user_id_idx ON cross_links (user_id)");
    await db.query(
        "CREATE INDEX IF NOT EXISTS cross_links_source_chunk_id_idx ON cross_links (source_chunk_id)",
    );
    await db.query(
        "CREATE INDEX IF NOT EXISTS cross_links_target_chunk_id_idx ON cross_links (target_chunk_id)",
    );
}

export type EventChunkInput = {
    userId?: string;
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

export async function upsertEventChunk(input: EventChunkInput): Promise<{ id: string }> {
    const db = getDbPool();
    const userId = input.userId ?? "demo-user";

    const result = await db.query<{ id: string }>(
        `
      INSERT INTO event_chunks (
        user_id,
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
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,($10)::vector)
            ON CONFLICT (user_id, source_type, external_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        source_url = EXCLUDED.source_url,
        author = EXCLUDED.author,
        occurred_at = EXCLUDED.occurred_at,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding,
        ingested_at = NOW()
      RETURNING id
    `,
        [
            userId,
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

    return result.rows[0];
}

export async function patchEventChunkMetadata(
    chunkId: string,
    metadataPatch: Record<string, unknown>,
): Promise<void> {
    const db = getDbPool();
    await db.query(
        `
      UPDATE event_chunks
      SET metadata = metadata || ($2)::jsonb
      WHERE id = $1
    `,
        [chunkId, JSON.stringify(metadataPatch)],
    );
}

export type CrossLinkInput = {
    userId?: string;
    sourceChunkId: string;
    targetChunkId: string;
    linkType: "hard_link" | "conflict" | "reasoning_trace";
    similarity: number;
    explanation: string;
    metadata?: Record<string, unknown>;
};

export async function upsertCrossLink(input: CrossLinkInput): Promise<void> {
    const db = getDbPool();
    const userId = input.userId ?? "demo-user";

    await db.query(
        `
      INSERT INTO cross_links (
        user_id,
        source_chunk_id,
        target_chunk_id,
        link_type,
        similarity,
        explanation,
        metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (user_id, source_chunk_id, target_chunk_id, link_type)
      DO UPDATE SET
        similarity = EXCLUDED.similarity,
        explanation = EXCLUDED.explanation,
        metadata = EXCLUDED.metadata,
        created_at = NOW()
    `,
        [
            userId,
            input.sourceChunkId,
            input.targetChunkId,
            input.linkType,
            input.similarity,
            input.explanation,
            input.metadata ?? {},
        ],
    );
}

export type SimilarChunk = {
    id: string;
    source_type: string;
    user_id: string;
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
    userId = "demo-user",
    sourceTypes?: Array<"slack" | "github" | "gmail" | "support" | "meeting">,
): Promise<SimilarChunk[]> {
    const db = getDbPool();
    const params: Array<string | number | string[]> = [`[${embedding.join(",")}]`, userId, topK];
    let sourceTypeFilter = "";
    if (sourceTypes?.length) {
        params.push(sourceTypes);
        sourceTypeFilter = "AND source_type = ANY($4::text[])";
    }

    const result = await db.query<SimilarChunk>(
        `
      SELECT
        id,
        source_type,
        user_id,
        external_id,
        title,
        content,
        source_url,
        author,
        occurred_at,
        metadata,
        1 - (embedding <=> ($1)::vector) AS similarity
      FROM event_chunks
      WHERE user_id = $2
      ${sourceTypeFilter}
      ORDER BY embedding <=> ($1)::vector
      LIMIT $3
    `,
        params,
    );

    return result.rows;
}

export type SourceStat = {
    source_type: string;
    count: number;
    latest_at: string | null;
};

export async function getSourceStats(userId = "demo-user"): Promise<SourceStat[]> {
    const db = getDbPool();
    const result = await db.query<SourceStat>(`
            SELECT
                source_type,
                COUNT(*)::int AS count,
                MAX(occurred_at) AS latest_at
            FROM event_chunks
            WHERE user_id = $1
            GROUP BY source_type
            ORDER BY count DESC, source_type ASC
        `, [userId]);

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

export async function getCorpusStatsForUser(userId = "demo-user"): Promise<{
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
            WHERE user_id = $1
        `, [userId]);

    const row = result.rows[0] ?? { total_chunks: "0", latest_ingested_at: null };

    return {
        totalChunks: Number(row.total_chunks),
        latestIngestedAt: row.latest_ingested_at,
    };
}

export async function getRecentUndocumentedDecisions(userId = "demo-user", limit = 3): Promise<Array<{
    id: string;
    title: string;
    source_type: string;
    author: string | null;
    occurred_at: string | null;
}>> {
    const db = getDbPool();
    const result = await db.query<{
        id: string;
        title: string;
        source_type: string;
        author: string | null;
        occurred_at: string | null;
    }>(`
            SELECT ec.id, ec.title, ec.source_type, ec.author, ec.occurred_at
            FROM event_chunks ec
            LEFT JOIN cross_links cl ON cl.user_id = ec.user_id AND cl.source_chunk_id = ec.id AND cl.link_type = 'hard_link'
            WHERE ec.user_id = $1
              AND ec.source_type IN ('slack', 'gmail')
              AND cl.id IS NULL
            ORDER BY ec.ingested_at DESC
            LIMIT $2
        `, [userId, limit]);

    return result.rows;
}

export async function getRecentCrossLinks(userId = "demo-user", limit = 5): Promise<Array<{
    source_title: string;
    target_title: string;
    link_type: string;
    similarity: number;
    explanation: string;
}>> {
    const db = getDbPool();
    const result = await db.query<{
        source_title: string;
        target_title: string;
        link_type: string;
        similarity: number;
        explanation: string;
    }>(`
            SELECT
                s.title AS source_title,
                t.title AS target_title,
                cl.link_type,
                cl.similarity,
                cl.explanation
            FROM cross_links cl
            JOIN event_chunks s ON s.id = cl.source_chunk_id
            JOIN event_chunks t ON t.id = cl.target_chunk_id
            WHERE cl.user_id = $1
            ORDER BY cl.created_at DESC
            LIMIT $2
        `, [userId, limit]);

    return result.rows;
}
