import { NextRequest, NextResponse } from "next/server";
import { assertIngestionAuth } from "@/lib/auth";
import { ingestGithubEvents } from "@/lib/connectors/github";
import { ingestRecords } from "@/lib/ingestion";

export async function POST(request: NextRequest) {
    try {
        assertIngestionAuth(request);
        const body = await request.json().catch(() => ({}));
        const records = await ingestGithubEvents({
            owner: body.owner,
            repo: body.repo,
            perPage: body.perPage,
        });
        const ingested = await ingestRecords("github", records);

        return NextResponse.json({ ok: true, fetched: records.length, ingested });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
