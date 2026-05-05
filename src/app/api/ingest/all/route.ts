import { NextRequest, NextResponse } from "next/server";
import { assertIngestionAuth } from "@/lib/auth";
import { ingestSlackEvents } from "@/lib/connectors/slack";
import { ingestGithubEvents } from "@/lib/connectors/github";
import { ingestGmailEvents } from "@/lib/connectors/gmail";
import { ingestRecords } from "@/lib/ingestion";
import { buildCompanyHealthReport } from "@/lib/relationship-scraper";

export async function POST(request: NextRequest) {
    try {
        assertIngestionAuth(request);
        const body = await request.json().catch(() => ({}));
        const userId = request.headers.get("x-user-id") ?? body.userId ?? "demo-user";

        const [slack, github, gmail] = await Promise.all([
            ingestSlackEvents({ channelIds: body.channelIds, limit: body.slackLimit, token: body.slackToken }),
            ingestGithubEvents({ owner: body.owner, repo: body.repo, perPage: body.githubPerPage, token: body.githubToken }),
            ingestGmailEvents({ query: body.gmailQuery, maxResults: body.gmailMaxResults, clientId: body.gmailClientId, clientSecret: body.gmailClientSecret, refreshToken: body.gmailRefreshToken }),
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
