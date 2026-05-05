import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/config";
import { ingestSlackEvents } from "@/lib/connectors/slack";
import { ingestGithubEvents } from "@/lib/connectors/github";
import { ingestGmailEvents } from "@/lib/connectors/gmail";
import { getWorkspaceOrDemoDefault, getWorkspaceConnectionMap } from "@/lib/db";

const validateSchema = z.object({
    provider: z.enum(["slack", "github", "gmail"]),
    config: z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const input = validateSchema.parse(body);
        const rawWorkspaceId = request.headers.get("x-workspace-id") ?? body.workspaceId ?? body.userId ?? request.headers.get("x-user-id") ?? "demo-user";
        const workspaceId = await getWorkspaceOrDemoDefault(rawWorkspaceId);
        const connectionMap = (await getWorkspaceConnectionMap(workspaceId).catch(() => ({}))) as Record<string, Record<string, unknown>>;

        if (input.provider === "slack") {
            const config = input.config as { channelIds?: string[]; token?: string };
            // Prefer token from config, then workspace connection, then env
            const token = (config.token as string | undefined) || (connectionMap.slack && (connectionMap.slack as Record<string, unknown>).token as string | undefined) || env.SLACK_BOT_TOKEN;
            if (!token) {
                return NextResponse.json({ ok: false, valid: false, error: "Slack token not configured for this workspace. Provide a bot token or install the Slack app." }, { status: 400 });
            }

            try {
                const sample = await ingestSlackEvents({ channelIds: config.channelIds?.slice(0, 1), limit: 1, token });
                return NextResponse.json({ ok: true, valid: true, message: `✅ Slack connected. Found ${sample.length} messages.` });
            } catch (error) {
                return NextResponse.json({ ok: false, valid: false, error: `Slack error: ${error instanceof Error ? error.message : "Unknown error"}. Verify the channel IDs exist and the bot has access.` }, { status: 400 });
            }
        }

        if (input.provider === "github") {
            const config = input.config as { owner?: string; repo?: string; token?: string };
            const token = (config.token as string | undefined) || (connectionMap.github && (connectionMap.github as Record<string, unknown>).token as string | undefined) || env.GITHUB_TOKEN;
            if (!token) {
                return NextResponse.json({ ok: false, valid: false, error: "GitHub token not configured for this workspace. Provide a token." }, { status: 400 });
            }

            try {
                const sample = await ingestGithubEvents({ owner: config.owner, repo: config.repo, perPage: 1, token });
                return NextResponse.json({ ok: true, valid: true, message: `✅ GitHub connected. Found ${sample.length} events.` });
            } catch (error) {
                return NextResponse.json({ ok: false, valid: false, error: `GitHub error: ${error instanceof Error ? error.message : "Unknown error"}. Verify the owner and repo exist and the token has access.` }, { status: 400 });
            }
        }

        if (input.provider === "gmail") {
            const config = input.config as { query?: string; clientId?: string; clientSecret?: string; refreshToken?: string };
            const clientId = (config.clientId as string | undefined) || (connectionMap.gmail && (connectionMap.gmail as Record<string, unknown>).clientId as string | undefined) || env.GMAIL_CLIENT_ID;
            const clientSecret = (config.clientSecret as string | undefined) || (connectionMap.gmail && (connectionMap.gmail as Record<string, unknown>).clientSecret as string | undefined) || env.GMAIL_CLIENT_SECRET;
            const refreshToken = (config.refreshToken as string | undefined) || (connectionMap.gmail && (connectionMap.gmail as Record<string, unknown>).refreshToken as string | undefined) || env.GMAIL_REFRESH_TOKEN;

            if (!clientId || !clientSecret || !refreshToken) {
                return NextResponse.json({ ok: false, valid: false, error: "Gmail credentials not configured for this workspace. Provide client id/secret and refresh token." }, { status: 400 });
            }

            try {
                const sample = await ingestGmailEvents({ query: config.query, maxResults: 1, clientId, clientSecret, refreshToken });
                return NextResponse.json({ ok: true, valid: true, message: `✅ Gmail connected. Found ${sample.length} emails.` });
            } catch (error) {
                return NextResponse.json({ ok: false, valid: false, error: `Gmail error: ${error instanceof Error ? error.message : "Unknown error"}. Verify the refresh token is valid.` }, { status: 400 });
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
