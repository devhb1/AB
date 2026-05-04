import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createWorkspace, listWorkspacesForAccount } from "@/lib/db";

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

        const workspaces = await listWorkspacesForAccount(accountId);
        return NextResponse.json({ ok: true, workspaces });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const input = workspaceSchema.parse(await request.json());
        const workspace = await createWorkspace({
            id: crypto.randomUUID(),
            accountId: input.accountId,
            name: input.name,
            slug: input.slug,
            description: input.description,
        });

        return NextResponse.json({ ok: true, workspace });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
