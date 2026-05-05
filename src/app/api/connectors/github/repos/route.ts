import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config";
import { Octokit } from "octokit";
import { getWorkspaceOrDemoDefault, getWorkspaceConnectionMap } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const owner = url.searchParams.get("owner") || undefined;
        const rawWorkspaceId = request.headers.get("x-workspace-id") || url.searchParams.get("workspaceId") || "demo-user";
        const workspaceId = await getWorkspaceOrDemoDefault(rawWorkspaceId);
        const connectionMap = (await getWorkspaceConnectionMap(workspaceId).catch(() => ({}))) as Record<string, Record<string, unknown>>;

        const token = (connectionMap.github && (connectionMap.github as Record<string, unknown>).token as string | undefined) || env.GITHUB_TOKEN;
        if (!token) return NextResponse.json({ ok: false, error: "GitHub token not configured" }, { status: 400 });

        const octokit = new Octokit({ auth: token });

        let repos: Array<{ id: number; name: string; full_name: string }> = [];
        if (owner) {
            const res = await octokit.request("GET /users/{username}/repos", { username: owner, per_page: 100 });
            repos = (res.data as Array<{ id: number; name: string; full_name: string; }>).map((r) => ({ id: r.id, name: r.name, full_name: r.full_name }));
        } else {
            const res = await octokit.request("GET /user/repos", { per_page: 100 });
            repos = (res.data as Array<{ id: number; name: string; full_name: string; }>).map((r) => ({ id: r.id, name: r.name, full_name: r.full_name }));
        }

        return NextResponse.json({ ok: true, repos });
    } catch (err) {
        return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
    }
}
