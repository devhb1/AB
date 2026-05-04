import { synthesizeReasoningTrace } from "@/lib/embeddings";
import {
    findSimilarChunks,
    getRecentCrossLinks,
    getRecentUndocumentedDecisions,
    patchEventChunkMetadata,
    upsertCrossLink,
} from "@/lib/db";

type IngestedRecord = {
    id: string;
    sourceType: "slack" | "github" | "gmail" | "support" | "meeting";
    title: string;
    content: string;
    author?: string;
    occurredAt?: string;
    metadata: Record<string, unknown>;
};

type RelationshipResult = {
    hardLinksCreated: number;
    conflictLinksCreated: number;
    reasoningTrace?: string;
    matchedTopics: string[];
};

function buildEvidenceBlock(chunk: {
    source_type: string;
    title: string;
    author: string | null;
    occurred_at: string | null;
    content: string;
}): string {
    return [
        `[${chunk.source_type.toUpperCase()}] ${chunk.title}`,
        `Author: ${chunk.author ?? "unknown"}`,
        `When: ${chunk.occurred_at ?? "unknown"}`,
        `Content: ${chunk.content}`,
    ].join("\n");
}

function hasConflictSignal(a: string, b: string): boolean {
    const conflictWords = ["blocked", "delay", "rollback", "cancel", "issue", "not ship", "cannot", "can't"];
    const approvalWords = ["approved", "ship", "greenlight", "go ahead", "done", "resolved", "launch"];
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aConflict = conflictWords.some((word) => aLower.includes(word));
    const bConflict = conflictWords.some((word) => bLower.includes(word));
    const aApproval = approvalWords.some((word) => aLower.includes(word));
    const bApproval = approvalWords.some((word) => bLower.includes(word));

    return (aConflict && bApproval) || (bConflict && aApproval);
}

export async function scrapeRelationships(params: {
    userId?: string;
    record: IngestedRecord;
    embedding: number[];
}): Promise<RelationshipResult> {
    const userId = params.userId ?? "demo-user";
    const targetSources = params.record.sourceType === "github"
        ? ["slack", "gmail"]
        : params.record.sourceType === "slack"
            ? ["github", "gmail", "support", "meeting"]
            : params.record.sourceType === "gmail"
                ? ["slack", "github", "support", "meeting"]
                : ["slack", "github", "gmail", "support", "meeting"];

    const similarChunks = await findSimilarChunks(params.embedding, 10, userId, targetSources as Array<
        "slack" | "github" | "gmail" | "support" | "meeting"
    >);

    const matches = similarChunks.filter((chunk) => chunk.external_id !== params.record.id && chunk.similarity >= 0.85);
    const hardLinkMatches = matches.slice(0, 3);

    let hardLinksCreated = 0;
    let conflictLinksCreated = 0;
    const matchedTopics = hardLinkMatches.map((chunk) => chunk.title);

    for (const match of hardLinkMatches) {
        await upsertCrossLink({
            userId,
            sourceChunkId: params.record.id,
            targetChunkId: match.id,
            linkType: "hard_link",
            similarity: match.similarity,
            explanation: `Shared topic cluster between ${params.record.sourceType} and ${match.source_type}`,
            metadata: {
                sourceTitle: params.record.title,
                targetTitle: match.title,
            },
        });
        hardLinksCreated += 1;

        if (hasConflictSignal(params.record.content, match.content)) {
            await upsertCrossLink({
                userId,
                sourceChunkId: params.record.id,
                targetChunkId: match.id,
                linkType: "conflict",
                similarity: match.similarity,
                explanation: `Potential contradiction between ${params.record.sourceType} and ${match.source_type}`,
                metadata: {
                    sourceTitle: params.record.title,
                    targetTitle: match.title,
                },
            });
            conflictLinksCreated += 1;
            await patchEventChunkMetadata(params.record.id, {
                conflict_flag: true,
                conflict_against: match.title,
            });
        }
    }

    let reasoningTrace: string | undefined;
    if (params.record.sourceType === "github" && hardLinkMatches.length > 0) {
        reasoningTrace = await synthesizeReasoningTrace({
            commitTitle: params.record.title,
            commitContent: params.record.content,
            evidenceBlocks: hardLinkMatches.map((chunk) => buildEvidenceBlock(chunk)),
        });

        await patchEventChunkMetadata(params.record.id, {
            reasoning_trace: reasoningTrace,
            linked_topics: matchedTopics,
        });

        for (const match of hardLinkMatches) {
            await upsertCrossLink({
                userId,
                sourceChunkId: params.record.id,
                targetChunkId: match.id,
                linkType: "reasoning_trace",
                similarity: match.similarity,
                explanation: "GitHub reasoning trace generated from linked Slack/Gmail evidence",
                metadata: {
                    reasoningTrace,
                    sourceTitle: params.record.title,
                    targetTitle: match.title,
                },
            });
        }
    }

    return {
        hardLinksCreated,
        conflictLinksCreated,
        reasoningTrace,
        matchedTopics,
    };
}

export async function buildCompanyHealthReport(userId = "demo-user"): Promise<{
    topUndocumentedDecisions: Array<{ id: string; title: string; source_type: string; author: string | null; occurred_at: string | null }>;
    recentCrossLinks: Array<{ source_title: string; target_title: string; link_type: string; similarity: number; explanation: string }>;
}> {
    const [topUndocumentedDecisions, recentCrossLinks] = await Promise.all([
        getRecentUndocumentedDecisions(userId, 3),
        getRecentCrossLinks(userId, 5),
    ]);

    return {
        topUndocumentedDecisions,
        recentCrossLinks,
    };
}