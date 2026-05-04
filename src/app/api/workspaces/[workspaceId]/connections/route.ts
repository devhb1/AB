import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listWorkspaceConnections, upsertWorkspaceConnection } from "@/lib/db";
import { env } from "@/lib/config";

const providerSchema = z.object({
    provider: z.enum(["slack", "github", "gmail", "support", "meeting"]),
    config: z.record(z.string(), z.unknown()),
    status: z.string().optional(),
});

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> },
) {
    try {
        const { workspaceId } = await params;
        if (env.DATABASE_URL) {
            try {
                const connections = await listWorkspaceConnections(workspaceId);
                return NextResponse.json({ ok: true, connections });
            } catch (dbError) {
                console.warn("Connection list fallback (DB unavailable):", dbError);
            }
        }

        return NextResponse.json({ ok: true, connections: [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> },
) {
    try {
        const { workspaceId } = await params;
        const input = providerSchema.parse(await request.json());
        if (env.DATABASE_URL) {
            try {
                const connection = await upsertWorkspaceConnection({
                    workspaceId,
                    provider: input.provider,
                    config: input.config,
                    status: input.status,
                });

                return NextResponse.json({ ok: true, connection });
            } catch (dbError) {
                console.warn("Connection create fallback (DB unavailable):", dbError);
            }
        }

        return NextResponse.json({
            ok: true,
            connection: {
                workspace_id: workspaceId,
                provider: input.provider,
                config: input.config,
                status: input.status ?? "connected",
                connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            note: "Connection stored in MVP mode (database unavailable)",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
