import { embedText } from "@/lib/embeddings";
import { ensureSchema, upsertEventChunk } from "@/lib/db";
import { scrapeRelationships } from "@/lib/relationship-scraper";

type GenericRecord = {
    externalId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    author?: string;
    occurredAt?: string;
    metadata: Record<string, unknown>;
};

export type IngestionSummary = {
    ingested: number;
    hardLinksCreated: number;
    conflictLinksCreated: number;
    reasoningTraces: number;
    matchedTopics: string[];
};

export async function ingestRecords(
    sourceType: "slack" | "github" | "gmail" | "support" | "meeting",
    records: GenericRecord[],
    userId = "demo-user",
): Promise<IngestionSummary> {
    if (!records.length) {
        return {
            ingested: 0,
            hardLinksCreated: 0,
            conflictLinksCreated: 0,
            reasoningTraces: 0,
            matchedTopics: [],
        };
    }

    await ensureSchema();
    let count = 0;
    let hardLinksCreated = 0;
    let conflictLinksCreated = 0;
    let reasoningTraces = 0;
    const matchedTopics = new Set<string>();

    for (const record of records) {
        const embedding = await embedText(`${record.title}\n${record.content}`);

        const inserted = await upsertEventChunk({
            userId,
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

        const relationshipResult = await scrapeRelationships({
            userId,
            record: {
                id: inserted.id,
                sourceType,
                title: record.title,
                content: record.content,
                author: record.author,
                occurredAt: record.occurredAt,
                metadata: record.metadata,
            },
            embedding,
        });

        hardLinksCreated += relationshipResult.hardLinksCreated;
        conflictLinksCreated += relationshipResult.conflictLinksCreated;
        reasoningTraces += relationshipResult.reasoningTrace ? 1 : 0;
        relationshipResult.matchedTopics.forEach((topic) => matchedTopics.add(topic));

        count += 1;
    }

    return {
        ingested: count,
        hardLinksCreated,
        conflictLinksCreated,
        reasoningTraces,
        matchedTopics: [...matchedTopics],
    };
}
