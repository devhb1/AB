import { embedText } from "@/lib/embeddings";
import { ensureSchema, upsertEventChunk } from "@/lib/db";

type GenericRecord = {
    externalId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    author?: string;
    occurredAt?: string;
    metadata: Record<string, unknown>;
};

export async function ingestRecords(
    sourceType: "slack" | "github" | "gmail" | "support" | "meeting",
    records: GenericRecord[],
): Promise<number> {
    if (!records.length) {
        return 0;
    }

    await ensureSchema();
    let count = 0;

    for (const record of records) {
        const embedding = await embedText(`${record.title}\n${record.content}`);

        await upsertEventChunk({
            sourceType,
            externalId: record.externalId,
            title: record.title,
            content: record.content,
            sourceUrl: record.sourceUrl,
            author: record.author,
            occurredAt: record.occurredAt,
            metadata: record.metadata,
            embedding,
        });

        count += 1;
    }

    return count;
}
