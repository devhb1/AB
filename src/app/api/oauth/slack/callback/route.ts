import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";
import { encryptToken } from "@/lib/crypto";
import { upsertWorkspaceConnection } from "@/lib/db";

/**
 * GET /api/oauth/slack/callback
 * Slack OAuth callback. Exchanges code for bot token and stores it.
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (!code || !state) {
            return NextResponse.json({ ok: false, error: "Missing code or state" }, { status: 400 });
        }

        // Parse state token
        let workspaceId = "demo";
        try {
            const stateData = JSON.parse(Buffer.from(state, "base64").toString());
            workspaceId = stateData.workspaceId || "demo";
        } catch (err) {
            console.error("Failed to parse state:", err);
        }

        if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
            return NextResponse.json({ ok: false, error: "Slack OAuth not configured" }, { status: 400 });
        }

        // Exchange code for token
        const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: env.SLACK_CLIENT_ID,
                client_secret: env.SLACK_CLIENT_SECRET,
                code,
                redirect_uri: `${env.APP_URL || "http://localhost:3000"}/api/oauth/slack/callback`,
            }).toString(),
        });

        type SlackOAuthResponse = {
            ok: boolean;
            access_token?: string;
            token_type?: string;
            scope?: string;
            bot_user_id?: string;
            app_id?: string;
            error?: string;
        };

        const tokenData = (await tokenResponse.json()) as SlackOAuthResponse;

        if (!tokenData.ok) {
            throw new Error(`Slack OAuth failed: ${tokenData.error || "Unknown error"}`);
        }

        if (!tokenData.access_token) {
            throw new Error("No access token in Slack response");
        }

        // Encrypt and store token
        const encryptedToken = encryptToken(tokenData.access_token);
        await upsertWorkspaceConnection({
            workspaceId,
            provider: "slack",
            config: {
                token: encryptedToken,
                status: "connected",
                installedAt: new Date().toISOString(),
                scope: tokenData.scope,
            },
            status: "connected",
        });

        // Redirect back to dashboard with success message
        const redirectUrl = new URL("/", env.APP_URL || "http://localhost:3000");
        redirectUrl.searchParams.append("slack_connected", "true");
        redirectUrl.searchParams.append("workspace", workspaceId);

        return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("Slack OAuth callback error:", errorMsg);

        const errorUrl = new URL("/", env.APP_URL || "http://localhost:3000");
        errorUrl.searchParams.append("error", encodeURIComponent(errorMsg));

        return NextResponse.redirect(errorUrl.toString());
    }
}
