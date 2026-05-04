import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { embedText, synthesizeDecisionTimeline } from "@/lib/embeddings";
import { ensureSchema, findSimilarChunks, getWorkspaceOrDemoDefault } from "@/lib/db";
import { env } from "@/lib/config";

const querySchema = z.object({
    question: z.string().min(5),
    topK: z.number().int().positive().max(20).optional(),
    userId: z.string().min(1).optional(),
    workspaceId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const input = querySchema.parse(body);
        const workspaceId = input.workspaceId ?? input.userId ?? request.headers.get("x-workspace-id") ?? request.headers.get("x-user-id") ?? "demo-user";
        const validWorkspaceId = await getWorkspaceOrDemoDefault(workspaceId);

        if (env.DATABASE_URL) {
            try {
                await ensureSchema();
                const embedding = await embedText(input.question);
                const chunks = await findSimilarChunks(embedding, input.topK ?? 8, validWorkspaceId);

                const contextBlocks = chunks.map((chunk) => {
                    return [
                        `[${chunk.source_type.toUpperCase()}] ${chunk.title}`,
                        `Author: ${chunk.author ?? "unknown"}`,
                        `When: ${chunk.occurred_at ?? "unknown"}`,
                        `URL: ${chunk.source_url ?? "n/a"}`,
                        `Reasoning trace: ${(chunk.metadata as { reasoning_trace?: string }).reasoning_trace ?? "n/a"}`,
                        `Content: ${chunk.content}`,
                    ].join("\n");
                });

                const memo = await synthesizeDecisionTimeline({
                    question: input.question,
                    contextBlocks,
                });

                return NextResponse.json({ ok: true, userId: validWorkspaceId, memo, evidence: chunks });
            } catch (dbError) {
                console.warn("Decision query fallback (DB unavailable):", dbError);
            }
        }

        return NextResponse.json({
            ok: true,
            userId: validWorkspaceId,
            memo: `MVP mode: no database available yet. Your question was received: ${input.question}`,
            evidence: [],
            note: "Query answered without DB persistence",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
