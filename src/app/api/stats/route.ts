import { NextRequest, NextResponse } from "next/server";
import { companyName, env } from "@/lib/config";
import { getCorpusStatsForUser, getSourceStats } from "@/lib/db";

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get("userId") ?? request.headers.get("x-user-id") ?? "demo-user";
    const [sources, corpus] = await Promise.all([getSourceStats(userId), getCorpusStatsForUser(userId)]);

    const readiness = {
        slack: Boolean(env.SLACK_BOT_TOKEN),
        github: Boolean(env.GITHUB_TOKEN),
        gmail: Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN),
        support: Boolean(env.ZENDESK_SUBDOMAIN && env.ZENDESK_API_KEY),
        meetings: Boolean(env.MEETING_INGESTION_SECRET),
    };

    return NextResponse.json({
        ok: true,
        companyName,
        userId,
        readiness,
        corpus,
        sources,
    });
}
