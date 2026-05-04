"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function LandingPage() {
    const { isSignedIn } = useUser();

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background-elevated)] backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                            <span className="text-sm font-bold tracking-[0.2em] text-[var(--foreground)]">26</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">YC-style workspace intelligence</p>
                            <h1 className="text-lg font-semibold text-[var(--foreground)]">AHB26</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeSwitcher />

                        {!isSignedIn ? (
                            <div className="flex gap-3">
                                <Link href="/sign-in" className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]">
                                    Sign in
                                </Link>
                                <Link href="/sign-up" className="rounded-full border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-black/30">
                                    Get started
                                </Link>
                            </div>
                        ) : (
                            <Link href="/dashboard" className="rounded-full border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-black/30">
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                            <span className="text-sm font-medium text-[var(--muted)]">The YC-style AI context engine</span>
                        </div>

                        <h2 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] md:text-6xl">
                            Keep your team&apos;s Slack, GitHub, and Gmail context in one place.
                        </h2>

                        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] md:text-xl">
                            AHB26 helps teams capture decisions, connect their sources, and build a shared memory
                            layer that powers better internal search and AI workflows.
                        </p>

                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Link href="/sign-up" className="rounded-full border border-[var(--primary)] bg-[var(--primary)] px-6 py-3 text-base font-semibold text-[var(--primary-foreground)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-black/30">
                                Start free
                            </Link>
                            <Link href="/sign-in" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-base font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                                I already have an account
                            </Link>
                        </div>
                    </div>

                    <div className="relative rounded-[2rem]">
                        <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[var(--surface)] blur-2xl" />
                        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-strong)] ring-1 ring-[var(--surface)]">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Dashboard preview</p>
                                    <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Create, connect, sync</h3>
                                </div>
                                <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">YC theme</div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-[var(--foreground)]">1. Create a workspace</p>
                                    <p className="mt-1 text-sm text-[var(--muted)]">Set up your team space and connect your account.</p>
                                </div>
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-[var(--foreground)]">2. Connect Slack, GitHub, Gmail</p>
                                    <p className="mt-1 text-sm text-[var(--muted)]">Bring in the sources your team already uses.</p>
                                </div>
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-[var(--foreground)]">3. Sync and query</p>
                                    <p className="mt-1 text-sm text-[var(--muted)]">Start syncing and surface context instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--surface)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Unified memory</p>
                        <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">One workspace for team context.</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Create a single source of truth for decisions and follow-up.</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--surface)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Fast onboarding</p>
                        <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">Sign in, create workspace, connect sources.</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">The dashboard is set up for quick setup and first sync.</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--surface)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Private by default</p>
                        <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">Keep your data under your control.</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Built to organize internal knowledge without adding noise.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
