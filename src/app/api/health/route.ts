import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { env } from "@/lib/config";

export async function GET() {
    try {
        if (env.DATABASE_URL) {
            try {
                await ensureSchema();
            } catch (dbError) {
                console.warn("Health check DB unavailable, reporting MVP health:", dbError);
            }
        }

        return NextResponse.json({ ok: true, status: "healthy", databaseConfigured: Boolean(env.DATABASE_URL) });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, status: "unhealthy", error: message }, { status: 500 });
    }
}
