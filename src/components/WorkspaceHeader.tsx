"use client";

import { useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

type Workspace = {
    id: string;
    name: string;
    slug: string;
};

type WorkspaceHeaderProps = {
    currentWorkspaceId?: string;
    workspaces?: Workspace[];
    onWorkspaceChange?: (workspaceId: string) => void;
};

export function WorkspaceHeader({
    currentWorkspaceId,
    workspaces = [],
    onWorkspaceChange,
}: WorkspaceHeaderProps) {
    const { user, isSignedIn } = useUser();
    const [showDropdown, setShowDropdown] = useState(false);

    if (!isSignedIn) {
        return null;
    }

    const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
            <div className="mx-auto max-w-6xl px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold text-slate-900">Decision Engine</h1>
                        {currentWorkspace && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                                >
                                    <span className="truncate max-w-xs">{currentWorkspace.name}</span>
                                    <svg
                                        className={`h-4 w-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                        />
                                    </svg>
                                </button>

                                {showDropdown && workspaces.length > 0 && (
                                    <div className="absolute left-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                                        <div className="max-h-64 overflow-y-auto">
                                            {workspaces.map((workspace) => (
                                                <button
                                                    key={workspace.id}
                                                    onClick={() => {
                                                        onWorkspaceChange?.(workspace.id);
                                                        setShowDropdown(false);
                                                    }}
                                                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 ${workspace.id === currentWorkspaceId
                                                        ? "bg-slate-50 font-semibold text-slate-900"
                                                        : "text-slate-700"
                                                        }`}
                                                >
                                                    {workspace.name}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="border-t border-slate-200 p-2">
                                            <Link
                                                href="/workspaces"
                                                className="block w-full rounded px-3 py-2 text-center text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                                            >
                                                Manage workspaces
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {user && (
                            <>
                                <span className="text-sm text-slate-600">{user.primaryEmailAddress?.emailAddress}</span>
                                <SignOutButton>
                                    <button
                                        type="button"
                                        className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                                    >
                                        Sign out
                                    </button>
                                </SignOutButton>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
