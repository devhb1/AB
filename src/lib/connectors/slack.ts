import { WebClient } from "@slack/web-api";
import { defaultSlackChannels, env } from "@/lib/config";

export type SlackEventRecord = {
    externalId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    author?: string;
    occurredAt?: string;
    metadata: Record<string, unknown>;
};

export async function ingestSlackEvents(params: {
    channelIds?: string[];
    limit?: number;
    token?: string;
}): Promise<SlackEventRecord[]> {
    const token = params.token || env.SLACK_BOT_TOKEN;
    if (!token) {
        return [];
    }

    const channels = params.channelIds?.length ? params.channelIds : defaultSlackChannels;
    if (!channels.length) {
        return [];
    }
    const client = new WebClient(token);
    const limit = Math.min(params.limit ?? 30, 100);
    const records: SlackEventRecord[] = [];

    for (const channel of channels) {
        const history = await client.conversations.history({
            channel,
            limit,
        });

        for (const message of history.messages ?? []) {
            if (!message.text || !message.ts) {
                continue;
            }

            const tsFloat = Number(message.ts);
            const occurredAt = Number.isFinite(tsFloat)
                ? new Date(tsFloat * 1000).toISOString()
                : undefined;

            records.push({
                externalId: `${channel}:${message.ts}`,
                title: `Slack message in ${channel}`,
                content: message.text,
                sourceUrl: undefined,
                author: message.user,
                occurredAt,
                metadata: {
                    channel,
                    thread_ts: message.thread_ts,
                    reactions: message.reactions,
                },
            });
        }
    }

    return records;
}

export async function listSlackChannels(token?: string): Promise<{ id: string; name: string; is_private: boolean }[]> {
    const finalToken = token || env.SLACK_BOT_TOKEN;
    if (!finalToken) return [];

    const client = new WebClient(finalToken);
    const results: { id: string; name: string; is_private: boolean }[] = [];
    let cursor: string | undefined = undefined;

    do {
        const res = await client.conversations.list({ cursor, limit: 200, exclude_archived: true, types: "public_channel,private_channel" });
        for (const ch of res.channels ?? []) {
            results.push({ id: ch.id as string, name: ch.name as string, is_private: !!ch.is_private });
        }
        const meta = res.response_metadata;
        if (meta && typeof meta === "object") {
            cursor = (meta as Record<string, unknown>)["next_cursor"] as string | undefined;
        } else {
            cursor = undefined;
        }
    } while (cursor);

    return results;
}
