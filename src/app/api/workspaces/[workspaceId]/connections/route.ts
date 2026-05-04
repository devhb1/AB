import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listWorkspaceConnections, upsertWorkspaceConnection } from "@/lib/db";

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
        const connections = await listWorkspaceConnections(workspaceId);
        return NextResponse.json({ ok: true, connections });
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
        const connection = await upsertWorkspaceConnection({
            workspaceId,
            provider: input.provider,
            config: input.config,
            status: input.status,
        });

        return NextResponse.json({ ok: true, connection });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
