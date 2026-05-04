import { NextRequest, NextResponse } from "next/server";
import { assertIngestionAuth } from "@/lib/auth";
import { ingestSlackEvents } from "@/lib/connectors/slack";
import { ingestRecords } from "@/lib/ingestion";

export async function POST(request: NextRequest) {
    try {
        assertIngestionAuth(request);
        const body = await request.json().catch(() => ({}));
        const records = await ingestSlackEvents({
            channelIds: body.channelIds,
            limit: body.limit,
        });
        const ingested = await ingestRecords("slack", records);

        return NextResponse.json({ ok: true, fetched: records.length, ingested });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
