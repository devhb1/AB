import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";
import { encryptToken } from "@/lib/crypto";
import { upsertWorkspaceConnection } from "@/lib/db";

/**
 * GET /api/oauth/github/callback
 * GitHub OAuth callback. Exchanges code for access token and stores it.
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

        if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
            return NextResponse.json({ ok: false, error: "GitHub OAuth not configured" }, { status: 400 });
        }

        // Exchange code for token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: env.GITHUB_CLIENT_ID,
                client_secret: env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: `${env.APP_URL || "http://localhost:3000"}/api/oauth/github/callback`,
            }).toString(),
        });

        type GitHubOAuthResponse = {
            access_token?: string;
            token_type?: string;
            scope?: string;
            error?: string;
            error_description?: string;
        };

        const tokenData = (await tokenResponse.json()) as GitHubOAuthResponse;

        if (tokenData.error) {
            throw new Error(`GitHub OAuth failed: ${tokenData.error_description || tokenData.error}`);
        }

        if (!tokenData.access_token) {
            throw new Error("No access token in GitHub response");
        }

        // Verify token works by fetching user info
        const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!userResponse.ok) {
            throw new Error("Failed to verify GitHub token");
        }

        // Encrypt and store token
        const encryptedToken = encryptToken(tokenData.access_token);
        await upsertWorkspaceConnection({
            workspaceId,
            provider: "github",
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
        redirectUrl.searchParams.append("github_connected", "true");
        redirectUrl.searchParams.append("workspace", workspaceId);

        return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("GitHub OAuth callback error:", errorMsg);

        const errorUrl = new URL("/", env.APP_URL || "http://localhost:3000");
        errorUrl.searchParams.append("error", encodeURIComponent(errorMsg));

        return NextResponse.redirect(errorUrl.toString());
    }
}
