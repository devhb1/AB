import { google } from "googleapis";
import { env } from "@/lib/config";

export type GmailEventRecord = {
    externalId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    author?: string;
    occurredAt?: string;
    metadata: Record<string, unknown>;
};

function decodeBase64(input: string): string {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf8");
}

function extractPlainBody(payload?: {
    body?: { data?: string | null };
    parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } }>;
}): string {
    if (!payload) {
        return "";
    }

    if (payload.body?.data) {
        return decodeBase64(payload.body.data);
    }

    const textPart = payload.parts?.find((part) => part.mimeType === "text/plain");
    if (textPart?.body?.data) {
        return decodeBase64(textPart.body.data);
    }

    return "";
}

export async function ingestGmailEvents(params?: {
    query?: string;
    maxResults?: number;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
}): Promise<GmailEventRecord[]> {
    const clientId = params?.clientId || env.GMAIL_CLIENT_ID;
    const clientSecret = params?.clientSecret || env.GMAIL_CLIENT_SECRET;
    const refreshToken = params?.refreshToken || env.GMAIL_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
        return [];
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const maxResults = Math.min(params?.maxResults ?? 25, 100);

    const list = await gmail.users.messages.list({ userId: "me", maxResults, q: params?.query });

    const ids = list.data.messages?.map((message) => message.id).filter(Boolean) as string[];
    if (!ids.length) {
        return [];
    }

    const records: GmailEventRecord[] = [];

    for (const id of ids) {
        const detail = await gmail.users.messages.get({
            userId: "me",
            id,
            format: "full",
        });

        const payload = detail.data.payload;
        const headers = payload?.headers ?? [];
        const subject = headers.find((header) => header.name?.toLowerCase() === "subject")?.value ??
            "Email thread";
        const from = headers.find((header) => header.name?.toLowerCase() === "from")?.value;
        const dateHeader = headers.find((header) => header.name?.toLowerCase() === "date")?.value;
        const body = extractPlainBody(payload);

        records.push({
            externalId: `gmail:${id}`,
            title: subject,
            content: body || subject,
            sourceUrl: `https://mail.google.com/mail/u/0/#inbox/${id}`,
            author: from ?? undefined,
            occurredAt: dateHeader ? new Date(dateHeader).toISOString() : undefined,
            metadata: {
                threadId: detail.data.threadId,
                snippet: detail.data.snippet,
            },
        });
    }

    return records;
}
