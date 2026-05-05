import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";

/**
 * GET /api/oauth/gmail/authorize
 * Redirects user to Google OAuth authorization page for Gmail access.
 * Expects query param: workspaceId
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get("workspaceId") || "demo";

        if (!env.GMAIL_CLIENT_ID) {
            return NextResponse.json({ ok: false, error: "Gmail OAuth not configured" }, { status: 400 });
        }

        // Generate state token for CSRF protection
        const state = Buffer.from(JSON.stringify({ workspaceId, ts: Date.now() })).toString("base64");

        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleAuthUrl.searchParams.append("client_id", env.GMAIL_CLIENT_ID);
        googleAuthUrl.searchParams.append("scope", "https://www.googleapis.com/auth/gmail.readonly");
        googleAuthUrl.searchParams.append("redirect_uri", `${env.APP_URL || "http://localhost:3000"}/api/oauth/gmail/callback`);
        googleAuthUrl.searchParams.append("response_type", "code");
        googleAuthUrl.searchParams.append("state", state);
        googleAuthUrl.searchParams.append("access_type", "offline");
        googleAuthUrl.searchParams.append("prompt", "consent");

        return NextResponse.redirect(googleAuthUrl.toString());
    } catch (error) {
        return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
