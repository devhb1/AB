"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function LandingPage() {
    const { isSignedIn } = useUser();

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fbfaf7]/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white shadow-sm">
                            <span className="text-sm font-bold tracking-[0.2em] text-slate-900">26</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">YC-style workspace intelligence</p>
                            <h1 className="text-lg font-semibold text-slate-900">AHB26</h1>
                        </div>
                    </div>

                    {!isSignedIn ? (
                        <div className="flex gap-3">
                            <Link
                                href="/sign-in"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/sign-up"
                                className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
                            >
                                Get started
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href="/dashboard"
                            className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                            <span className="text-sm font-medium text-slate-600">The YC-style AI context engine</span>
                        </div>

                        <h2 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-slate-950 md:text-6xl">
                            Keep your team&apos;s Slack, GitHub, and Gmail context in one place.
                        </h2>

                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                            AHB26 helps teams capture decisions, connect their sources, and build a shared memory
                            layer that powers better internal search and AI workflows.
                        </p>

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Link
                                href="/sign-up"
                                className="rounded-full border border-slate-900 bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
                            >
                                Start free
                            </Link>
                            <Link
                                href="/sign-in"
                                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                I already have an account
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg ring-1 ring-slate-100">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Dashboard preview</p>
                                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Create, connect, sync</h3>
                            </div>
                            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                YC theme
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">1. Create a workspace</p>
                                <p className="mt-1 text-sm text-slate-600">Set up your team space and connect your account.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">2. Connect Slack, GitHub, Gmail</p>
                                <p className="mt-1 text-sm text-slate-600">Bring in the sources your team already uses.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">3. Sync and query</p>
                                <p className="mt-1 text-sm text-slate-600">Start syncing and surface context instantly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-100">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Unified memory</p>
                        <p className="mt-4 text-lg font-semibold text-slate-950">One workspace for team context.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Create a single source of truth for decisions and follow-up.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-100">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Fast onboarding</p>
                        <p className="mt-4 text-lg font-semibold text-slate-950">Sign in, create workspace, connect sources.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">The dashboard is set up for quick setup and first sync.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-100">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Private by default</p>
                        <p className="mt-4 text-lg font-semibold text-slate-950">Keep your data under your control.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Built to organize internal knowledge without adding noise.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
