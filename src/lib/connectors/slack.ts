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
}): Promise<SlackEventRecord[]> {
    if (!env.SLACK_BOT_TOKEN) {
        return [];
    }

    const channels = params.channelIds?.length ? params.channelIds : defaultSlackChannels;
    if (!channels.length) {
        return [];
    }

    const client = new WebClient(env.SLACK_BOT_TOKEN);
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
