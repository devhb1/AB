import { NextResponse } from "next/server";
import { companyName, env } from "@/lib/config";
import { getCorpusStats, getSourceStats } from "@/lib/db";

export async function GET() {
    const [sources, corpus] = await Promise.all([getSourceStats(), getCorpusStats()]);

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
        readiness,
        corpus,
        sources,
    });
}
