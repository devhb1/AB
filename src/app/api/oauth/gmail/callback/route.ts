import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";
import { encryptToken } from "@/lib/crypto";
import { upsertWorkspaceConnection } from "@/lib/db";

/**
 * GET /api/oauth/gmail/callback
 * Gmail OAuth callback. Exchanges code for tokens and stores refresh token.
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

        if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET) {
            return NextResponse.json({ ok: false, error: "Gmail OAuth not configured" }, { status: 400 });
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: env.GMAIL_CLIENT_ID,
                client_secret: env.GMAIL_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: `${env.APP_URL || "http://localhost:3000"}/api/oauth/gmail/callback`,
            }).toString(),
        });

        type GoogleOAuthResponse = {
            access_token?: string;
            refresh_token?: string;
            expires_in?: number;
            token_type?: string;
            scope?: string;
            error?: string;
            error_description?: string;
        };

        const tokenData = (await tokenResponse.json()) as GoogleOAuthResponse;

        if (tokenData.error) {
            throw new Error(`Gmail OAuth failed: ${tokenData.error_description || tokenData.error}`);
        }

        if (!tokenData.access_token) {
            throw new Error("No access token in Gmail response");
        }

        // Verify token works by fetching user info
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!userResponse.ok) {
            throw new Error("Failed to verify Gmail token");
        }

        // Encrypt and store tokens (focus on refresh token for long-term use)
        const refreshToken = tokenData.refresh_token || "no-refresh-token";
        const encryptedRefreshToken = encryptToken(refreshToken);
        const encryptedAccessToken = encryptToken(tokenData.access_token);

        await upsertWorkspaceConnection({
            workspaceId,
            provider: "gmail",
            config: {
                refreshToken: encryptedRefreshToken,
                accessToken: encryptedAccessToken,
                status: "connected",
                installedAt: new Date().toISOString(),
                scope: tokenData.scope,
                expiresAt: tokenData.expires_in ? (Date.now() + tokenData.expires_in * 1000) : undefined,
            },
            status: "connected",
        });

        // Redirect back to dashboard with success message
        const redirectUrl = new URL("/", env.APP_URL || "http://localhost:3000");
        redirectUrl.searchParams.append("gmail_connected", "true");
        redirectUrl.searchParams.append("workspace", workspaceId);

        return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("Gmail OAuth callback error:", errorMsg);

        const errorUrl = new URL("/", env.APP_URL || "http://localhost:3000");
        errorUrl.searchParams.append("error", encodeURIComponent(errorMsg));

        return NextResponse.redirect(errorUrl.toString());
    }
}
