"use client";

import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";

type ApiResult = {
    ok: boolean;
    [key: string]: unknown;
};

type WorkspaceRecord = {
    id: string;
    account_id: string;
    name: string;
    slug: string;
    description: string | null;
};

type DashboardStats = {
    companyName: string;
    userId?: string;
    readiness: Record<string, boolean>;
    corpus: {
        totalChunks: number;
        latestIngestedAt: string | null;
    };
};

const ACCOUNT_KEY = "ahb26-account-id";
const WORKSPACE_KEY = "ahb26-workspace-id";

export function Dashboard() {
    const { user } = useUser();
    const [accountId, setAccountId] = useState("");
    const [workspaceName, setWorkspaceName] = useState("My Workspace");
    const [workspaceId, setWorkspaceId] = useState("");
    const [slackChannels, setSlackChannels] = useState("");
    const [githubOwner, setGithubOwner] = useState("");
    const [githubRepo, setGithubRepo] = useState("");
    const [gmailQuery, setGmailQuery] = useState("newer_than:30d");
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loadingWorkspace, setLoadingWorkspace] = useState(false);
    const [loadingSlack, setLoadingSlack] = useState(false);
    const [loadingGithub, setLoadingGithub] = useState(false);
    const [loadingGmail, setLoadingGmail] = useState(false);
    const [loadingSync, setLoadingSync] = useState(false);
    const [message, setMessage] = useState("");

    const loadStats = async (wsId: string) => {
        try {
            const response = await fetch(`/api/stats?workspaceId=${encodeURIComponent(wsId)}`);
            const data = (await response.json()) as DashboardStats & { ok?: boolean };
            if (data?.companyName) {
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to load stats:", err);
        }
    };

    // Initialize from localStorage or create account
    useEffect(() => {
        const initializeAccount = async () => {
            const storedAccountId = window.localStorage.getItem(ACCOUNT_KEY);

            if (storedAccountId) {
                setAccountId(storedAccountId);
                const storedWorkspaceId = window.localStorage.getItem(WORKSPACE_KEY);
                if (storedWorkspaceId) {
                    setWorkspaceId(storedWorkspaceId);
                    loadStats(storedWorkspaceId);
                }
            } else if (user?.id) {
                // Create account for this user
                const response = await fetch("/api/accounts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-id": user.id,
                    },
                    body: JSON.stringify({
                        name: user.fullName || "Team",
                        email: user.primaryEmailAddress?.emailAddress || "",
                    }),
                });
                const data = (await response.json()) as ApiResult & { account?: { id: string } };
                if (data.ok && data.account) {
                    const accId = data.account.id;
                    setAccountId(accId);
                    window.localStorage.setItem(ACCOUNT_KEY, accId);
                }
            }
        };

        void initializeAccount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const createWorkspace = async () => {
        if (!accountId) {
            setMessage("Error: Account not created yet");
            return;
        }
        setLoadingWorkspace(true);
        try {
            const response = await fetch("/api/workspaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user?.id || "demo",
                },
                body: JSON.stringify({
                    accountId,
                    name: workspaceName,
                    slug: workspaceName.toLowerCase().replace(/\s+/g, "-"),
                    description: "Team context workspace",
                }),
            });
            const data = (await response.json()) as ApiResult & { workspace?: WorkspaceRecord };
            if (data.ok && data.workspace) {
                const wsId = data.workspace.id;
                setWorkspaceId(wsId);
                window.localStorage.setItem(WORKSPACE_KEY, wsId);
                setMessage("✅ Workspace created");
                await loadStats(wsId);
            } else {
                setMessage(`❌ Failed to create workspace`);
            }
        } catch (err) {
            setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setLoadingWorkspace(false);
        }
    };

    const connectProvider = async (provider: "slack" | "github" | "gmail") => {
        if (!workspaceId) {
            setMessage("Create workspace first");
            return;
        }

        const setLoading = {
            slack: setLoadingSlack,
            github: setLoadingGithub,
            gmail: setLoadingGmail,
        }[provider];

        setLoading(true);
        try {
            const config =
                provider === "slack"
                    ? { channelIds: slackChannels.split(",").map((c) => c.trim()).filter(Boolean) }
                    : provider === "github"
                        ? { owner: githubOwner, repo: githubRepo }
                        : { query: gmailQuery };

            const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/connections`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user?.id || "demo",
                },
                body: JSON.stringify({
                    provider,
                    config,
                    status: "connected",
                }),
            });
            const data = (await response.json()) as ApiResult;
            if (data.ok) {
                setMessage(`✅ ${provider} connected`);
                await loadStats(workspaceId);
            } else {
                setMessage(`❌ Failed to connect ${provider}`);
            }
        } catch (err) {
            setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background-elevated)] backdrop-blur-sm">
                <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-sm">
                            <span className="text-[var(--primary-foreground)] font-bold text-sm">26</span>
                        </div>
                        <span className="text-2xl font-extrabold text-[var(--foreground)]">AHB26</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-[var(--muted)]">
                            Welcome, {user?.firstName || "Team"}
                        </div>
                        <SignOutButton redirectUrl="/" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto max-w-6xl px-6 py-12">
                {/* Status Message */}
                {message && (
                    <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                        <p className="text-[var(--foreground)]">{message}</p>
                    </div>
                )}

                {/* Workspace Section */}
                {!workspaceId ? (
                    <div className="max-w-3xl mx-auto">
                        <div className="relative rounded-3xl">
                            <div className="absolute -inset-6 -z-10 rounded-3xl bg-[var(--surface)] blur-2xl"></div>
                            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-12 shadow-[var(--shadow-strong)]">
                                <h2 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Create Your Workspace</h2>
                                <p className="mb-6 text-[var(--muted)]">
                                    Set up a workspace to start syncing your team context from Slack, GitHub, and Gmail.
                                </p>
                                <input
                                    type="text"
                                    placeholder="Workspace name"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)]"
                                />
                                <button
                                    onClick={() => void createWorkspace()}
                                    disabled={loadingWorkspace}
                                    className="w-full rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)] hover:shadow-lg disabled:opacity-60"
                                >
                                    {loadingWorkspace ? "Creating..." : "Create Workspace"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Workspace Info */}
                        <div className="mb-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm ring-1 ring-[var(--surface)]">
                            <h2 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Workspace</h2>
                            <div className="space-y-3">
                                <p className="text-[var(--muted)]">
                                    <span className="font-semibold text-[var(--foreground)]">Name:</span> {workspaceName}
                                </p>
                                <p className="text-[var(--muted)]">
                                    <span className="font-semibold text-[var(--foreground)]">ID:</span> {workspaceId}
                                </p>
                                {stats && (
                                    <p className="text-[var(--muted)]">
                                        <span className="font-semibold text-[var(--foreground)]">Events Stored:</span> {stats.corpus.totalChunks}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Connect Sources */}
                        <div className="mb-12">
                            <h2 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Connect Your Sources</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Slack */}
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--surface)]">
                                    <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Slack</h3>
                                    <p className="mb-4 text-sm text-[var(--muted)]">
                                        Sync your Slack channel history and discussions.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Channel IDs (comma-separated)"
                                        value={slackChannels}
                                        onChange={(e) => setSlackChannels(e.target.value)}
                                        className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                                    />
                                    <button
                                        onClick={() => void connectProvider("slack")}
                                        disabled={loadingSlack || !slackChannels}
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 font-semibold text-[var(--foreground)] hover:border-[var(--foreground)] disabled:opacity-60"
                                    >
                                        {loadingSlack ? "Connecting..." : "Connect Slack"}
                                    </button>
                                </div>

                                {/* GitHub */}
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--surface)]">
                                    <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">GitHub</h3>
                                    <p className="mb-4 text-sm text-[var(--muted)]">
                                        Sync commits, PRs, and issues from your repos.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Owner"
                                        value={githubOwner}
                                        onChange={(e) => setGithubOwner(e.target.value)}
                                        className="mb-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Repository"
                                        value={githubRepo}
                                        onChange={(e) => setGithubRepo(e.target.value)}
                                        className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                                    />
                                    <button
                                        onClick={() => void connectProvider("github")}
                                        disabled={loadingGithub || !githubOwner || !githubRepo}
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 font-semibold text-[var(--foreground)] hover:border-[var(--foreground)] disabled:opacity-60"
                                    >
                                        {loadingGithub ? "Connecting..." : "Connect GitHub"}
                                    </button>
                                </div>

                                {/* Gmail */}
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--surface)]">
                                    <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Gmail</h3>
                                    <p className="mb-4 text-sm text-[var(--muted)]">
                                        Sync important email threads and conversations.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Search query"
                                        value={gmailQuery}
                                        onChange={(e) => setGmailQuery(e.target.value)}
                                        className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                                    />
                                    <button
                                        onClick={() => void connectProvider("gmail")}
                                        disabled={loadingGmail || !gmailQuery}
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 font-semibold text-[var(--foreground)] hover:border-[var(--foreground)] disabled:opacity-60"
                                    >
                                        {loadingGmail ? "Connecting..." : "Connect Gmail"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm ring-1 ring-[var(--surface)]">
                            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Sync your workspace</h2>
                                    <p className="mt-2 text-[var(--muted)]">
                                        After connecting Slack, GitHub, and Gmail, start the initial sync to ingest context.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setLoadingSync(true);
                                        void fetch("/api/onboarding/sync", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "x-user-id": user?.id || "demo",
                                            },
                                            body: JSON.stringify({ workspaceId }),
                                        })
                                            .then(async (response) => (await response.json()) as ApiResult)
                                            .then((data) => {
                                                if (data.ok) {
                                                    setMessage("✅ Sync completed. Your context is being processed...");
                                                    void loadStats(workspaceId);
                                                } else {
                                                    setMessage("❌ Sync failed");
                                                }
                                            })
                                            .catch((err) => {
                                                setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
                                            })
                                            .finally(() => {
                                                setLoadingSync(false);
                                            });
                                    }}
                                    disabled={loadingSync || !workspaceId}
                                    className="rounded-full border border-[var(--primary)] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-black/30 disabled:opacity-60"
                                >
                                    {loadingSync ? "Syncing..." : "Start sync"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
