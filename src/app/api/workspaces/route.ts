import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createWorkspace, listWorkspacesForAccount } from "@/lib/db";
import { env } from "@/lib/config";

const workspaceSchema = z.object({
    accountId: z.string().min(1),
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const accountId = request.nextUrl.searchParams.get("accountId");
        if (!accountId) {
            return NextResponse.json({ ok: false, error: "Missing accountId" }, { status: 400 });
        }

        if (env.DATABASE_URL) {
            try {
                const workspaces = await listWorkspacesForAccount(accountId);
                return NextResponse.json({ ok: true, workspaces });
            } catch (dbError) {
                console.warn("Workspace list fallback (DB unavailable):", dbError);
            }
        }

        return NextResponse.json({ ok: true, workspaces: [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const input = workspaceSchema.parse(await request.json());
        const workspaceId = crypto.randomUUID();

        if (env.DATABASE_URL) {
            try {
                const workspace = await createWorkspace({
                    id: workspaceId,
                    accountId: input.accountId,
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                });

                return NextResponse.json({ ok: true, workspace });
            } catch (dbError) {
                console.warn("Workspace create fallback (DB unavailable):", dbError);
            }
        }

        return NextResponse.json({
            ok: true,
            workspace: {
                id: workspaceId,
                account_id: input.accountId,
                name: input.name,
                slug: input.slug,
                description: input.description ?? null,
                created_at: new Date().toISOString(),
            },
            note: "Workspace created in MVP mode (database unavailable)",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
