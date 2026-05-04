import { NextRequest, NextResponse } from "next/server";
import { companyName } from "@/lib/config";
import { getCorpusStatsForUser, getSourceStats, getWorkspaceReadiness } from "@/lib/db";

export async function GET(request: NextRequest) {
    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? request.nextUrl.searchParams.get("userId") ?? request.headers.get("x-user-id") ?? "demo-user";
    const [sources, corpus, readiness] = await Promise.all([
        getSourceStats(workspaceId),
        getCorpusStatsForUser(workspaceId),
        getWorkspaceReadiness(workspaceId),
    ]);

    return NextResponse.json({
        ok: true,
        companyName,
        userId: workspaceId,
        readiness,
        corpus,
        sources,
    });
}
