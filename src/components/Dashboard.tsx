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
        <main className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">
                <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                            <span className="text-white font-bold text-sm">26</span>
                        </div>
                        <span className="text-xl font-bold text-black">AHB26</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-600">
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
                    <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-black">{message}</p>
                    </div>
                )}

                {/* Workspace Section */}
                {!workspaceId ? (
                    <div className="max-w-lg mx-auto">
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-lg ring-1 ring-slate-100">
                            <h2 className="text-2xl font-bold text-black mb-2">Create Your Workspace</h2>
                            <p className="text-slate-600 mb-6">
                                Set up a workspace to start syncing your team context from Slack, GitHub, and Gmail.
                            </p>
                            <input
                                type="text"
                                placeholder="Workspace name"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 text-black placeholder-slate-400 border border-slate-200 mb-4"
                            />
                            <button
                                onClick={() => void createWorkspace()}
                                disabled={loadingWorkspace}
                                className="w-full px-6 py-3 rounded-lg bg-black text-white font-semibold hover:shadow-lg disabled:opacity-60"
                            >
                                {loadingWorkspace ? "Creating..." : "Create Workspace"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Workspace Info */}
                        <div className="mb-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-md ring-1 ring-slate-100">
                            <h2 className="text-2xl font-bold text-black mb-6">Workspace</h2>
                            <div className="space-y-3">
                                <p className="text-slate-600">
                                    <span className="font-semibold text-black">Name:</span> {workspaceName}
                                </p>
                                <p className="text-slate-600">
                                    <span className="font-semibold text-black">ID:</span> {workspaceId}
                                </p>
                                {stats && (
                                    <p className="text-slate-600">
                                        <span className="font-semibold text-black">Events Stored:</span> {stats.corpus.totalChunks}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Connect Sources */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-black mb-6">Connect Your Sources</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Slack */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-100">
                                    <h3 className="text-lg font-semibold text-black mb-2">Slack</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Sync your Slack channel history and discussions.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Channel IDs (comma-separated)"
                                        value={slackChannels}
                                        onChange={(e) => setSlackChannels(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 text-black placeholder-slate-400 border border-slate-200 text-sm mb-4"
                                    />
                                    <button
                                        onClick={() => void connectProvider("slack")}
                                        disabled={loadingSlack || !slackChannels}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-semibold disabled:opacity-60"
                                    >
                                        {loadingSlack ? "Connecting..." : "Connect Slack"}
                                    </button>
                                </div>

                                {/* GitHub */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-100">
                                    <h3 className="text-lg font-semibold text-black mb-2">GitHub</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Sync commits, PRs, and issues from your repos.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Owner"
                                        value={githubOwner}
                                        onChange={(e) => setGithubOwner(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 text-black placeholder-slate-400 border border-slate-200 text-sm mb-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Repository"
                                        value={githubRepo}
                                        onChange={(e) => setGithubRepo(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 text-black placeholder-slate-400 border border-slate-200 text-sm mb-4"
                                    />
                                    <button
                                        onClick={() => void connectProvider("github")}
                                        disabled={loadingGithub || !githubOwner || !githubRepo}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-semibold disabled:opacity-60"
                                    >
                                        {loadingGithub ? "Connecting..." : "Connect GitHub"}
                                    </button>
                                </div>

                                {/* Gmail */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-100">
                                    <h3 className="text-lg font-semibold text-black mb-2">Gmail</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Sync important email threads and conversations.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Search query"
                                        value={gmailQuery}
                                        onChange={(e) => setGmailQuery(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 text-black placeholder-slate-400 border border-slate-200 text-sm mb-4"
                                    />
                                    <button
                                        onClick={() => void connectProvider("gmail")}
                                        disabled={loadingGmail || !gmailQuery}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-semibold disabled:opacity-60"
                                    >
                                        {loadingGmail ? "Connecting..." : "Connect Gmail"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-8 shadow-md ring-1 ring-slate-100">
                            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-black">Sync your workspace</h2>
                                    <p className="mt-2 text-slate-600">
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
                                    className="rounded-full border border-slate-900 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-60"
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
