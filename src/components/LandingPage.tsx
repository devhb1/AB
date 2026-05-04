"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function LandingPage() {
    const { isSignedIn } = useUser();

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400">
                            <span className="text-sm font-bold text-slate-900">26</span>
                        </div>
                        <span className="text-xl font-bold text-white">AHB26</span>
                    </div>

                    {!isSignedIn ? (
                        <div className="flex gap-3">
                            <Link
                                href="/sign-in"
                                className="px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/sign-up"
                                className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <Link
                                href="/"
                                className="px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
                            >
                                Open Dashboard
                            </Link>
                            <Link
                                href="/workspaces"
                                className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
                            >
                                Create Workspace
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-6 py-20 md:py-32">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-6 inline-block rounded-full border border-slate-700 bg-slate-800 px-4 py-2">
                        <span className="text-sm font-medium text-cyan-400">The AI Context Engine</span>
                    </div>

                    <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
                        Your Team&apos;s Memory Unified
                    </h1>

                    <p className="mb-8 text-xl leading-relaxed text-slate-300">
                        AHB26 stores all your company context from Slack, GitHub, Gmail, and meetings.
                        Your AI assistant reasons over this unified context to help you make better decisions faster.
                    </p>

                    {!isSignedIn ? (
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                href="/sign-up"
                                className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
                            >
                                Sign up
                            </Link>
                            <Link
                                href="/sign-in"
                                className="rounded-lg border border-cyan-500 px-8 py-4 text-lg font-semibold text-cyan-400 transition hover:bg-cyan-500/10"
                            >
                                Log in
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                href="/workspaces"
                                className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
                            >
                                Create workspace
                            </Link>
                            <Link
                                href="/"
                                className="rounded-lg border border-cyan-500 px-8 py-4 text-lg font-semibold text-cyan-400 transition hover:bg-cyan-500/10"
                            >
                                Go to dashboard
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
                <div className="grid items-center gap-12 md:grid-cols-2">
                    <div>
                        <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">About Us</h2>
                        <p className="mb-4 text-lg text-slate-300">
                            AHB26 is a unified context platform built for fast-moving teams. We solve a critical
                            problem in modern companies: context loss.
                        </p>
                        <p className="text-lg text-slate-300">
                            When your team communicates across Slack, GitHub, Gmail, and meetings, critical decisions
                            and their reasoning get scattered. AHB26 brings it all together.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
                                <div>
                                    <p className="font-semibold text-white">Unified Data Lake</p>
                                    <p className="text-sm text-slate-400">All context in one place</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
                                <div>
                                    <p className="font-semibold text-white">AI-Powered Reasoning</p>
                                    <p className="text-sm text-slate-400">Understand why decisions were made</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
                                <div>
                                    <p className="font-semibold text-white">Secure and Private</p>
                                    <p className="text-sm text-slate-400">Your data, your control</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
