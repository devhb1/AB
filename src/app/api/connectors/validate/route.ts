import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestSlackEvents } from "@/lib/connectors/slack";
import { ingestGithubEvents } from "@/lib/connectors/github";
import { ingestGmailEvents } from "@/lib/connectors/gmail";

const validateSchema = z.object({
    provider: z.enum(["slack", "github", "gmail"]),
    config: z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
    try {
        const input = validateSchema.parse(await request.json());

        if (input.provider === "slack") {
            const config = input.config as { channelIds?: string[] };
            try {
                // Try to ingest a small sample to test the token
                const sample = await ingestSlackEvents({
                    channelIds: config.channelIds?.slice(0, 1),
                    limit: 1,
                });
                // If we get here without error, the token works
                return NextResponse.json({
                    ok: true,
                    valid: true,
                    message: `✅ Slack connected. Found ${sample.length} messages.`,
                });
            } catch (error) {
                return NextResponse.json(
                    {
                        ok: false,
                        valid: false,
                        error: `Slack validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                    },
                    { status: 400 },
                );
            }
        }

        if (input.provider === "github") {
            const config = input.config as { owner?: string; repo?: string };
            try {
                // Try to fetch a small sample to test the token
                const sample = await ingestGithubEvents({
                    owner: config.owner,
                    repo: config.repo,
                    perPage: 1,
                });
                // If we get here without error, the token works
                return NextResponse.json({
                    ok: true,
                    valid: true,
                    message: `✅ GitHub connected. Found ${sample.length} events.`,
                });
            } catch (error) {
                return NextResponse.json(
                    {
                        ok: false,
                        valid: false,
                        error: `GitHub validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                    },
                    { status: 400 },
                );
            }
        }

        if (input.provider === "gmail") {
            const config = input.config as { query?: string };
            try {
                // Try to fetch a small sample to test the token
                const sample = await ingestGmailEvents({
                    query: config.query,
                    maxResults: 1,
                });
                // If we get here without error, the token works
                return NextResponse.json({
                    ok: true,
                    valid: true,
                    message: `✅ Gmail connected. Found ${sample.length} emails.`,
                });
            } catch (error) {
                return NextResponse.json(
                    {
                        ok: false,
                        valid: false,
                        error: `Gmail validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                    },
                    { status: 400 },
                );
            }
        }

        return NextResponse.json(
            { ok: false, error: "Unknown provider" },
            { status: 400 },
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
