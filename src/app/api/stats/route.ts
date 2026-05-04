import { NextRequest, NextResponse } from "next/server";
import { companyName } from "@/lib/config";
import { getCorpusStatsForUser, getSourceStats, getWorkspaceReadiness, getWorkspaceOrDemoDefault } from "@/lib/db";
import { env } from "@/lib/config";

export async function GET(request: NextRequest) {
    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? request.nextUrl.searchParams.get("userId") ?? request.headers.get("x-workspace-id") ?? request.headers.get("x-user-id") ?? "demo-user";
    const validWorkspaceId = await getWorkspaceOrDemoDefault(workspaceId);
    if (env.DATABASE_URL) {
        try {
            const [sources, corpus, readiness] = await Promise.all([
                getSourceStats(validWorkspaceId),
                getCorpusStatsForUser(validWorkspaceId),
                getWorkspaceReadiness(validWorkspaceId),
            ]);

            return NextResponse.json({
                ok: true,
                companyName,
                userId: validWorkspaceId,
                readiness,
                corpus,
                sources,
            });
        } catch (dbError) {
            console.warn("Stats fallback (DB unavailable):", dbError);
        }
    }

    return NextResponse.json({
        ok: true,
        companyName,
        userId: validWorkspaceId,
        readiness: {
            slack: false,
            github: false,
            gmail: false,
        },
        corpus: {
            totalChunks: 0,
            latestIngestedAt: null,
        },
        sources: {
            slack: 0,
            github: 0,
            gmail: 0,
        },
    });
}
