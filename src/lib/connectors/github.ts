import { Octokit } from "octokit";
import { env } from "@/lib/config";

export type GithubEventRecord = {
    externalId: string;
    title: string;
    content: string;
    sourceUrl?: string;
    author?: string;
    occurredAt?: string;
    metadata: Record<string, unknown>;
};

export async function ingestGithubEvents(params?: {
    owner?: string;
    repo?: string;
    perPage?: number;
    token?: string;
}): Promise<GithubEventRecord[]> {
    const token = params?.token || env.GITHUB_TOKEN;
    if (!token) {
        return [];
    }

    const owner = params?.owner ?? env.GITHUB_OWNER;
    const repo = params?.repo ?? env.GITHUB_REPO;
    if (!owner || !repo) {
        return [];
    }
    const octokit = new Octokit({ auth: token });
    const perPage = Math.min(params?.perPage ?? 30, 100);

    const [commits, pulls, issues] = await Promise.all([
        octokit.request("GET /repos/{owner}/{repo}/commits", {
            owner,
            repo,
            per_page: perPage,
        }),
        octokit.request("GET /repos/{owner}/{repo}/pulls", {
            owner,
            repo,
            state: "all",
            per_page: Math.min(perPage, 30),
        }),
        octokit.request("GET /repos/{owner}/{repo}/issues", {
            owner,
            repo,
            state: "all",
            per_page: Math.min(perPage, 30),
        }),
    ]);

    const records: GithubEventRecord[] = [];

    for (const commit of commits.data) {
        records.push({
            externalId: `commit:${commit.sha}`,
            title: commit.commit.message.split("\n")[0] ?? `Commit ${commit.sha.slice(0, 8)}`,
            content: commit.commit.message,
            sourceUrl: commit.html_url,
            author: commit.author?.login ?? commit.commit.author?.name,
            occurredAt: commit.commit.author?.date ?? undefined,
            metadata: {
                owner,
                repo,
                sha: commit.sha,
            },
        });
    }

    for (const pull of pulls.data) {
        records.push({
            externalId: `pr:${pull.id}`,
            title: `PR #${pull.number}: ${pull.title}`,
            content: pull.body ?? pull.title,
            sourceUrl: pull.html_url,
            author: pull.user?.login,
            occurredAt: pull.updated_at ?? pull.created_at ?? undefined,
            metadata: {
                owner,
                repo,
                number: pull.number,
                state: pull.state,
            },
        });
    }

    for (const issue of issues.data) {
        records.push({
            externalId: `issue:${issue.id}`,
            title: `Issue #${issue.number}: ${issue.title}`,
            content: issue.body ?? issue.title,
            sourceUrl: issue.html_url,
            author: issue.user?.login,
            occurredAt: issue.updated_at ?? issue.created_at ?? undefined,
            metadata: {
                owner,
                repo,
                number: issue.number,
                state: issue.state,
            },
        });
    }

    return records;
}
