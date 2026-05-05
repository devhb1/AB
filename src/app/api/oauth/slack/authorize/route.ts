import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";

/**
 * GET /api/oauth/slack/authorize
 * Redirects user to Slack OAuth authorization page.
 * Expects query param: workspaceId
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get("workspaceId") || "demo";

        if (!env.SLACK_CLIENT_ID) {
            return NextResponse.json({ ok: false, error: "Slack OAuth not configured" }, { status: 400 });
        }

        // Generate state token for CSRF protection
        const state = Buffer.from(JSON.stringify({ workspaceId, ts: Date.now() })).toString("base64");

        const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
        slackAuthUrl.searchParams.append("client_id", env.SLACK_CLIENT_ID);
        slackAuthUrl.searchParams.append("scope", "channels:read,channels:history,chat:write");
        slackAuthUrl.searchParams.append("redirect_uri", `${env.APP_URL}/api/oauth/slack/callback`);
        slackAuthUrl.searchParams.append("state", state);

        // Log and optionally return the auth URL for debugging
        console.log("[oauth] Slack auth URL:", slackAuthUrl.toString());
        if (url.searchParams.get("debug") === "1") {
            return NextResponse.json({ ok: true, url: slackAuthUrl.toString() });
        }

        return NextResponse.redirect(slackAuthUrl.toString());
    } catch (error) {
        return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
