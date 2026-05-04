import { NextRequest, NextResponse } from "next/server";
import { assertIngestionAuth } from "@/lib/auth";
import { ingestSlackEvents } from "@/lib/connectors/slack";
import { ingestGithubEvents } from "@/lib/connectors/github";
import { ingestGmailEvents } from "@/lib/connectors/gmail";
import { ingestRecords } from "@/lib/ingestion";

export async function POST(request: NextRequest) {
    try {
        assertIngestionAuth(request);
        const body = await request.json().catch(() => ({}));

        const [slack, github, gmail] = await Promise.all([
            ingestSlackEvents({ channelIds: body.channelIds, limit: body.slackLimit }),
            ingestGithubEvents({ owner: body.owner, repo: body.repo, perPage: body.githubPerPage }),
            ingestGmailEvents({ query: body.gmailQuery, maxResults: body.gmailMaxResults }),
        ]);

        const [slackIngested, githubIngested, gmailIngested] = await Promise.all([
            ingestRecords("slack", slack),
            ingestRecords("github", github),
            ingestRecords("gmail", gmail),
        ]);

        return NextResponse.json({
            ok: true,
            slack: { fetched: slack.length, ingested: slackIngested },
            github: { fetched: github.length, ingested: githubIngested },
            gmail: { fetched: gmail.length, ingested: gmailIngested },
            totalIngested: slackIngested + githubIngested + gmailIngested,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
