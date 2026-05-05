import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";

/**
 * GET /api/oauth/github/authorize
 * Redirects user to GitHub OAuth authorization page.
 * Expects query param: workspaceId
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get("workspaceId") || "demo";

        if (!env.GITHUB_CLIENT_ID) {
            return NextResponse.json({ ok: false, error: "GitHub OAuth not configured" }, { status: 400 });
        }

        // Generate state token for CSRF protection
        const state = Buffer.from(JSON.stringify({ workspaceId, ts: Date.now() })).toString("base64");

        const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
        githubAuthUrl.searchParams.append("client_id", env.GITHUB_CLIENT_ID);
        githubAuthUrl.searchParams.append("scope", "repo,read:user");
        githubAuthUrl.searchParams.append("redirect_uri", `${env.APP_URL}/api/oauth/github/callback`);
        githubAuthUrl.searchParams.append("state", state);
        githubAuthUrl.searchParams.append("allow_signup", "false");

        // Log and optionally return the auth URL for debugging
        console.log("[oauth] GitHub auth URL:", githubAuthUrl.toString());
        if (url.searchParams.get("debug") === "1") {
            return NextResponse.json({ ok: true, url: githubAuthUrl.toString() });
        }

        return NextResponse.redirect(githubAuthUrl.toString());
    } catch (error) {
        return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
