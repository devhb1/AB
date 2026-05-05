import { NextRequest, NextResponse } from "next/server";
import { listSlackChannels } from "@/lib/connectors/slack";
import { env } from "@/lib/config";
import { getWorkspaceOrDemoDefault, getWorkspaceConnectionMap } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const rawWorkspaceId = request.headers.get("x-workspace-id") || undefined;
        const workspaceId = rawWorkspaceId ? await getWorkspaceOrDemoDefault(rawWorkspaceId) : undefined;
        const connectionMap = workspaceId ? (await getWorkspaceConnectionMap(workspaceId).catch(() => ({}))) as Record<string, Record<string, unknown>> : {};

        const token = (connectionMap.slack && (connectionMap.slack as Record<string, unknown>).token as string | undefined) || env.SLACK_BOT_TOKEN;
        if (!token) return NextResponse.json({ ok: false, error: "Slack token not configured" }, { status: 400 });

        const channels = await listSlackChannels(token);
        return NextResponse.json({ ok: true, channels });
    } catch (err) {
        return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
    }
}
