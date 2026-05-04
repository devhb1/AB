import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function GET() {
    try {
        await ensureSchema();
        return NextResponse.json({ ok: true, status: "healthy" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, status: "unhealthy", error: message }, { status: 500 });
    }
}
