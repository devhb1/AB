import { NextRequest, NextResponse } from "next/server";
import { ingestSlackEvents } from "@/lib/connectors/slack";
import { ingestGithubEvents } from "@/lib/connectors/github";
import { ingestGmailEvents } from "@/lib/connectors/gmail";
import { ingestRecords } from "@/lib/ingestion";
import { buildCompanyHealthReport } from "@/lib/relationship-scraper";
import { getWorkspaceConnectionMap } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const userId = request.headers.get("x-user-id") ?? body.userId ?? body.workspaceId ?? "demo-user";
        const connections = await getWorkspaceConnectionMap(userId);
        const slackConnection = connections.slack ?? {};
        const githubConnection = connections.github ?? {};
        const gmailConnection = connections.gmail ?? {};

        const [slack, github, gmail] = await Promise.all([
            ingestSlackEvents({
                channelIds: body.channelIds ?? (slackConnection.channelIds as string[] | undefined),
                limit: body.slackLimit ?? (slackConnection.limit as number | undefined) ?? 30,
            }),
            ingestGithubEvents({
                owner: body.owner ?? (githubConnection.owner as string | undefined),
                repo: body.repo ?? (githubConnection.repo as string | undefined),
                perPage: body.githubPerPage ?? (githubConnection.perPage as number | undefined) ?? 30,
            }),
            ingestGmailEvents({
                query: body.gmailQuery ?? (gmailConnection.query as string | undefined),
                maxResults: body.gmailMaxResults ?? (gmailConnection.maxResults as number | undefined) ?? 25,
            }),
        ]);

        const [slackSummary, githubSummary, gmailSummary] = await Promise.all([
            ingestRecords("slack", slack, userId),
            ingestRecords("github", github, userId),
            ingestRecords("gmail", gmail, userId),
        ]);

        const report = await buildCompanyHealthReport(userId);

        return NextResponse.json({
            ok: true,
            userId,
            syncWindowDays: body.syncWindowDays ?? 30,
            slack: { fetched: slack.length, ...slackSummary },
            github: { fetched: github.length, ...githubSummary },
            gmail: { fetched: gmail.length, ...gmailSummary },
            totalIngested:
                slackSummary.ingested + githubSummary.ingested + gmailSummary.ingested,
            hardLinksCreated:
                slackSummary.hardLinksCreated + githubSummary.hardLinksCreated + gmailSummary.hardLinksCreated,
            conflictLinksCreated:
                slackSummary.conflictLinksCreated + githubSummary.conflictLinksCreated + gmailSummary.conflictLinksCreated,
            reasoningTraces:
                slackSummary.reasoningTraces + githubSummary.reasoningTraces + gmailSummary.reasoningTraces,
            report,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}