import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertIngestionAuth } from "@/lib/auth";
import { ingestRecords } from "@/lib/ingestion";

const manualSchema = z.object({
    sourceType: z.enum(["support", "meeting"]),
    records: z.array(
        z.object({
            externalId: z.string().min(1),
            title: z.string().min(1),
            content: z.string().min(1),
            sourceUrl: z.string().optional(),
            author: z.string().optional(),
            occurredAt: z.string().optional(),
            metadata: z.record(z.string(), z.unknown()).optional(),
        }),
    ).min(1),
});

export async function POST(request: NextRequest) {
    try {
        assertIngestionAuth(request);
        const body = manualSchema.parse(await request.json());
        const userId = request.headers.get("x-user-id") ?? "demo-user";
        const records = body.records.map((record) => ({
            ...record,
            metadata: record.metadata ?? {},
        }));
        const summary = await ingestRecords(body.sourceType, records, userId);

        return NextResponse.json({ ok: true, userId, ...summary });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
