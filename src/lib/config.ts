import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    OPENAI_API_KEY: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1).optional(),
    SLACK_BOT_TOKEN: z.string().optional(),
    SLACK_CLIENT_ID: z.string().optional(),
    SLACK_CLIENT_SECRET: z.string().optional(),
    SLACK_CHANNEL_IDS: z.string().optional(),
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GITHUB_OWNER: z.string().optional(),
    GITHUB_REPO: z.string().optional(),
    GMAIL_CLIENT_ID: z.string().optional(),
    GMAIL_CLIENT_SECRET: z.string().optional(),
    GMAIL_REFRESH_TOKEN: z.string().optional(),
    ENCRYPTION_KEY: z.string().optional(),
    APP_URL: z.string().optional(),
    ZENDESK_SUBDOMAIN: z.string().optional(),
    ZENDESK_API_KEY: z.string().optional(),
    MEETING_INGESTION_SECRET: z.string().optional(),
    INGESTION_SHARED_SECRET: z.string().optional(),
    COMPANY_NAME: z.string().optional(),
    PRIMARY_DOMAIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => {
        const key = issue.path.join(".");
        return `- ${key}: ${issue.message}`;
    });
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}`);
}

// Prefer an explicit APP_URL, then a canonical PRIMARY_DOMAIN, and fall back
// to a known production URL on Vercel or localhost during local development.
const rawEnv = parsed.data;
const canonicalProductionUrl = "https://ahbyc2026.vercel.app";
const localDevelopmentUrl = "http://localhost:3000";

function normalizeAppUrl(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const candidate = value.trim().replace(/\/+$/, "");

    try {
        return new URL(candidate).origin;
    } catch {
        return undefined;
    }
}

const isLocalDevelopment = rawEnv.NODE_ENV === "development" && !process.env.VERCEL;
const resolvedAppUrl =
    normalizeAppUrl(rawEnv.APP_URL) ??
    normalizeAppUrl(rawEnv.PRIMARY_DOMAIN) ??
    (isLocalDevelopment ? localDevelopmentUrl : canonicalProductionUrl);

export const env = {
    ...rawEnv,
    APP_URL: resolvedAppUrl,
};

export const defaultSlackChannels = env.SLACK_CHANNEL_IDS
    ? env.SLACK_CHANNEL_IDS.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

export const companyName = env.COMPANY_NAME ?? "AHB26";
