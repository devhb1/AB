import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { embedText, synthesizeDecisionTimeline } from "@/lib/embeddings";
import { ensureSchema, findSimilarChunks } from "@/lib/db";

const querySchema = z.object({
    question: z.string().min(5),
    topK: z.number().int().positive().max(20).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const input = querySchema.parse(body);

        await ensureSchema();
        const embedding = await embedText(input.question);
        const chunks = await findSimilarChunks(embedding, input.topK ?? 8);

        const contextBlocks = chunks.map((chunk) => {
            return [
                `[${chunk.source_type.toUpperCase()}] ${chunk.title}`,
                `Author: ${chunk.author ?? "unknown"}`,
                `When: ${chunk.occurred_at ?? "unknown"}`,
                `URL: ${chunk.source_url ?? "n/a"}`,
                `Content: ${chunk.content}`,
            ].join("\n");
        });

        const memo = await synthesizeDecisionTimeline({
            question: input.question,
            contextBlocks,
        });

        return NextResponse.json({ ok: true, memo, evidence: chunks });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
