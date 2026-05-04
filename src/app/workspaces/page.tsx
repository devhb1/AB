"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import Link from "next/link";

type Workspace = {
    id: string;
    account_id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
};

type ApiResult = {
    ok: boolean;
    [key: string]: unknown;
};

const ACCOUNT_KEY = "decision-engine-account-id";
const WORKSPACE_KEY = "decision-engine-workspace-id";
const WORKSPACE_NAME_KEY = "decision-engine-workspace-name";
const LEGACY_ACCOUNT_KEY = "ahb26-account-id";

export default function WorkspacesPage() {
    const { isLoaded, isSignedIn } = useUser();
    const [accountId, setAccountId] = useState("");
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [newWorkspaceSlug, setNewWorkspaceSlug] = useState("");
    const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) {
            return;
        }

        const storedAccountId =
            window.localStorage.getItem(ACCOUNT_KEY) ||
            window.localStorage.getItem(LEGACY_ACCOUNT_KEY) ||
            "";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAccountId(storedAccountId);

        if (storedAccountId) {
            window.localStorage.setItem(ACCOUNT_KEY, storedAccountId);
        }

        if (!storedAccountId) {
            setError("No account found. Please create an account first.");
            setLoading(false);
            return;
        }

        void fetch(`/api/workspaces?accountId=${encodeURIComponent(storedAccountId)}`)
            .then((response) => response.json())
            .then((data: ApiResult & { workspaces?: Workspace[] }) => {
                if (data.ok && data.workspaces) {
                    setWorkspaces(data.workspaces);
                } else {
                    setError(data.error as string || "Failed to load workspaces");
                }
            })
            .catch((err) => {
                setError(`Error: ${err.message}`);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [isLoaded, isSignedIn]);

    async function createWorkspace() {
        if (!newWorkspaceName.trim() || !newWorkspaceSlug.trim() || !accountId) {
            setError("Please fill in workspace name and slug");
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const response = await fetch("/api/workspaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": accountId,
                },
                body: JSON.stringify({
                    accountId,
                    name: newWorkspaceName,
                    slug: newWorkspaceSlug,
                    description: newWorkspaceDesc,
                }),
            });

            const data: ApiResult = await response.json();

            if (data.ok && (data.workspace as Workspace)) {
                const newWorkspace = data.workspace as Workspace;
                setWorkspaces([newWorkspace, ...workspaces]);
                setNewWorkspaceName("");
                setNewWorkspaceSlug("");
                setNewWorkspaceDesc("");
                window.localStorage.setItem(WORKSPACE_KEY, newWorkspace.id);
                window.localStorage.setItem(WORKSPACE_NAME_KEY, newWorkspace.name);
            } else {
                setError(data.error as string || "Failed to create workspace");
            }
        } catch (err) {
            setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setCreating(false);
        }
    }

    if (!isLoaded || !isSignedIn) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <div className="mx-auto max-w-6xl px-6 py-20 text-center">
                    <p className="text-slate-600">Please sign in to manage workspaces.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <WorkspaceHeader workspaces={workspaces} />

            <div className="mx-auto max-w-6xl px-6 py-10">
                <h1 className="mb-8 text-3xl font-bold text-slate-900">Manage Workspaces</h1>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Create new workspace */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">Create New Workspace</h2>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Workspace name"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="slug-name"
                                value={newWorkspaceSlug}
                                onChange={(e) => setNewWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                            />
                            <textarea
                                placeholder="Description (optional)"
                                value={newWorkspaceDesc}
                                onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                rows={3}
                            />
                            <button
                                onClick={() => void createWorkspace()}
                                disabled={creating}
                                className="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                                {creating ? "Creating..." : "Create Workspace"}
                            </button>
                        </div>
                    </div>

                    {/* Existing workspaces list */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">Your Workspaces</h2>
                        {loading ? (
                            <p className="text-sm text-slate-600">Loading...</p>
                        ) : workspaces.length === 0 ? (
                            <p className="text-sm text-slate-600">No workspaces yet. Create one to get started.</p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {workspaces.map((workspace) => (
                                    <Link
                                        key={workspace.id}
                                        href={`/?workspace=${workspace.id}`}
                                        className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50 hover:border-slate-300"
                                    >
                                        <p className="font-medium text-slate-900">{workspace.name}</p>
                                        <p className="text-xs text-slate-600">{workspace.slug}</p>
                                        {workspace.description && (
                                            <p className="mt-1 text-xs text-slate-600">{workspace.description}</p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-500">
                                            Created {new Date(workspace.created_at).toLocaleDateString()}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <Link href="/" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
