"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

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

const ACCOUNT_KEY = "decision-engine-account-id";
const WORKSPACE_KEY = "decision-engine-workspace-id";
const LEGACY_ACCOUNT_KEY = "ahb26-account-id";
const LEGACY_WORKSPACE_KEY = "ahb26-workspace-id";

export function Dashboard() {
    const { user } = useUser();
    const [accountId, setAccountId] = useState("");
    const [workspaceName, setWorkspaceName] = useState("My Workspace");
    const [workspaceSlug] = useState("my-workspace");
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
            const storedAccountId =
                window.localStorage.getItem(ACCOUNT_KEY) ||
                window.localStorage.getItem(LEGACY_ACCOUNT_KEY);

            if (storedAccountId) {
                setAccountId(storedAccountId);
                window.localStorage.setItem(ACCOUNT_KEY, storedAccountId);
                const storedWorkspaceId =
                    window.localStorage.getItem(WORKSPACE_KEY) ||
                    window.localStorage.getItem(LEGACY_WORKSPACE_KEY);
                if (storedWorkspaceId) {
                    setWorkspaceId(storedWorkspaceId);
                    window.localStorage.setItem(WORKSPACE_KEY, storedWorkspaceId);
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
                    slug: workspaceSlug,
                    description: "Team context workspace",
                }),
            });
            const data = (await response.json()) as ApiResult & { workspace?: WorkspaceRecord };
            if (data.ok && data.workspace) {
                const wsId = data.workspace.id;
                setWorkspaceId(wsId);
                setWorkspaceName(wsId);
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

    const runSync = async () => {
        if (!workspaceId) {
            setMessage("Create workspace first");
            return;
        }
        setLoadingSync(true);
        try {
            const response = await fetch("/api/onboarding/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user?.id || "demo",
                },
                body: JSON.stringify({ workspaceId }),
            });
            const data = (await response.json()) as ApiResult;
            if (data.ok) {
                setMessage("✅ Sync completed. Your context is being processed...");
                await loadStats(workspaceId);
            } else {
                setMessage("❌ Sync failed");
            }
        } catch (err) {
            setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setLoadingSync(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                            <span className="text-slate-900 font-bold text-sm">26</span>
                        </div>
                        <span className="text-xl font-bold text-white">AHB26</span>
                    </div>
                    <div className="text-sm text-slate-400">
                        Welcome, {user?.firstName || "Team"}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto max-w-6xl px-6 py-12">
                {/* Status Message */}
                {message && (
                    <div className="mb-6 p-4 rounded-lg bg-slate-800 border border-slate-700">
                        <p className="text-white">{message}</p>
                    </div>
                )}

                {/* Workspace Status */}
                <div className="mb-12 rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Your Workspace</h2>
                    {workspaceId ? (
                        <div className="space-y-4">
                            <p className="text-slate-300">
                                <span className="font-semibold">Workspace ID:</span> {workspaceId}
                            </p>
                            <p className="text-slate-300">
                                <span className="font-semibold">Events Stored:</span> {stats?.corpus.totalChunks || 0}
                            </p>
                            {stats?.corpus.latestIngestedAt && (
                                <p className="text-slate-300">
                                    <span className="font-semibold">Last Updated:</span> {new Date(stats.corpus.latestIngestedAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Workspace name"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600"
                            />
                            <button
                                onClick={() => void createWorkspace()}
                                disabled={loadingWorkspace}
                                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold disabled:opacity-60"
                            >
                                {loadingWorkspace ? "Creating..." : "Create Workspace"}
                            </button>
                        </div>
                    )}
                </div>

                {workspaceId && (
                    <>
                        {/* Connect Sources */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6">Connect Your Sources</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Slack */}
                                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">📱 Slack</h3>
                                    <p className="text-sm text-slate-300 mb-4">
                                        Connect your Slack workspace to sync all channel history and discussions.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Channel IDs (comma-separated)"
                                        value={slackChannels}
                                        onChange={(e) => setSlackChannels(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 text-sm mb-4"
                                    />
                                    <button
                                        onClick={() => void connectProvider("slack")}
                                        disabled={loadingSlack || !slackChannels}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold disabled:opacity-60"
                                    >
                                        {loadingSlack ? "Connecting..." : "Connect Slack"}
                                    </button>
                                </div>

                                {/* GitHub */}
                                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">💻 GitHub</h3>
                                    <p className="text-sm text-slate-300 mb-4">
                                        Connect your GitHub repository to sync commits, PRs, and issues.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Owner"
                                        value={githubOwner}
                                        onChange={(e) => setGithubOwner(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 text-sm mb-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Repository"
                                        value={githubRepo}
                                        onChange={(e) => setGithubRepo(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 text-sm mb-4"
                                    />
                                    <button
                                        onClick={() => void connectProvider("github")}
                                        disabled={loadingGithub || !githubOwner || !githubRepo}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold disabled:opacity-60"
                                    >
                                        {loadingGithub ? "Connecting..." : "Connect GitHub"}
                                    </button>
                                </div>

                                {/* Gmail */}
                                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">📧 Gmail</h3>
                                    <p className="text-sm text-slate-300 mb-4">
                                        Connect your Gmail account to sync important email threads.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Search query (e.g., newer_than:30d)"
                                        value={gmailQuery}
                                        onChange={(e) => setGmailQuery(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 text-sm mb-4"
                                    />
                                    <button
                                        onClick={() => void connectProvider("gmail")}
                                        disabled={loadingGmail}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold disabled:opacity-60"
                                    >
                                        {loadingGmail ? "Connecting..." : "Connect Gmail"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sync Button */}
                        <div className="rounded-2xl border border-slate-700 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-8 text-center">
                            <h3 className="text-2xl font-bold text-white mb-4">Ready to Sync?</h3>
                            <p className="text-slate-300 mb-6">
                                Once you&apos;ve connected your sources, click below to start ingesting your team&apos;s context.
                            </p>
                            <button
                                onClick={() => void runSync()}
                                disabled={loadingSync}
                                className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-60"
                            >
                                {loadingSync ? "Syncing..." : "Start Syncing"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
