import { NextRequest, NextResponse } from "next/server";
import { assertIngestionAuth } from "@/lib/auth";
import { ingestGmailEvents } from "@/lib/connectors/gmail";
import { ingestRecords } from "@/lib/ingestion";

export async function POST(request: NextRequest) {
    try {
        assertIngestionAuth(request);
        const body = await request.json().catch(() => ({}));
        const records = await ingestGmailEvents({
            query: body.query,
            maxResults: body.maxResults,
            clientId: body.clientId,
            clientSecret: body.clientSecret,
            refreshToken: body.refreshToken,
        });
        const ingested = await ingestRecords("gmail", records);

        return NextResponse.json({ ok: true, fetched: records.length, ingested });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
