"use client";

/* eslint-disable react/no-unescaped-entities */

import { SignUpButton, SignInButton } from "@clerk/nextjs";

export function LandingPage() {
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
                    <div className="flex gap-3">
                        <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                            <button className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                            <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition">
                                Get Started Free
                            </button>
                        </SignUpButton>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="mx-auto max-w-6xl px-6 py-20 md:py-32">
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-block mb-6 px-4 py-2 rounded-full bg-slate-800 border border-slate-700">
                        <span className="text-sm font-medium text-cyan-400">The AI Context Engine</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Your Team&apos;s Memory Unified
                    </h1>

                    <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                        AHB26 stores all your company context from Slack, GitHub, Gmail, and meetings.
                        Your AI assistant reasons over this unified context to help you make better decisions faster.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                            <button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition">
                                Start Free Now
                            </button>
                        </SignUpButton>
                        <a href="#how-it-works" className="px-8 py-4 text-lg font-semibold text-cyan-400 border border-cyan-500 rounded-lg hover:bg-cyan-500/10 transition">
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* What We Are */}
            <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">What We Are</h2>
                        <p className="text-lg text-slate-300 mb-4">
                            AHB26 is a unified context platform designed for teams that move fast. We solve a critical problem in modern companies: context loss.
                        </p>
                        <p className="text-lg text-slate-300">
                            When your team communicates across Slack, GitHub, Gmail, and meetings, critical decisions and their reasoning get scattered. AHB26 brings it all together.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">Unified Data Lake</p>
                                    <p className="text-sm text-slate-400">All context in one place</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">AI-Powered Reasoning</p>
                                    <p className="text-sm text-slate-400">Understand why decisions were made</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">Secure & Private</p>
                                    <p className="text-sm text-slate-400">Your data, your control</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* What We Provide */}
            <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">What We Provide</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Automatic Context Ingestion",
                            description: "Connect Slack, GitHub, Gmail, and meetings. We automatically pull all your context and organize it.",
                            icon: "📥"
                        },
                        {
                            title: "AI Decision Synthesis",
                            description: "Our AI analyzes your unified context to synthesize decision memos showing what happened, why, and who decided.",
                            icon: "🧠"
                        },
                        {
                            title: "Search & Retrieval",
                            description: "Find decisions by reasoning, not just keywords. \"Why did we choose this database?\" instantly answered.",
                            icon: "🔍"
                        },
                        {
                            title: "Team Workspace",
                            description: "Multi-workspace support for teams. Each team gets its own isolated context and decision graph.",
                            icon: "👥"
                        },
                        {
                            title: "Decision Timeline",
                            description: "See the full timeline of how decisions evolved. Track who said what and when across all channels.",
                            icon: "📅"
                        },
                        {
                            title: "Privacy First",
                            description: "PII redaction, self-hosted options, and SOC2-ready. Your sensitive data stays protected.",
                            icon: "🔒"
                        }
                    ].map((item, i) => (
                        <div key={i} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 hover:border-slate-600 hover:bg-slate-800/70 transition">
                            <div className="text-3xl mb-4">{item.icon}</div>
                            <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                            <p className="text-slate-300">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How We Do It */}
            <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">How We Do It</h2>
                <div className="space-y-8">
                    {[
                        {
                            step: "1",
                            title: "Connect Your Sources",
                            description: "Authorize AHB26 to access your Slack workspace, GitHub repositories, Gmail account, and upload meeting notes."
                        },
                        {
                            step: "2",
                            title: "Automatic Ingestion",
                            description: "We continuously pull new messages, commits, emails, and meeting transcripts into your secure workspace."
                        },
                        {
                            step: "3",
                            title: "Context Embedding",
                            description: "Every piece of context is converted into semantic embeddings using advanced AI models, stored in your vector database."
                        },
                        {
                            step: "4",
                            title: "AI Reasoning",
                            description: "When you ask a question or need a decision memo, our AI searches your unified context and synthesizes reasoning."
                        },
                        {
                            step: "5",
                            title: "Decision Timeline",
                            description: "The system builds decision timelines showing what happened, why it happened, and who made the call."
                        }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold">{item.step}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-300">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Problem We Solve */}
            <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
                <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-12 md:p-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The Problem We Solve</h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <p className="text-lg text-slate-300 mb-6">
                                <span className="font-semibold text-white">Knowledge Loss:</span> When your team scales, context dies.
                                People leave, Slack messages disappear, and nobody remembers why you made that architecture decision 2 years ago.
                            </p>
                            <p className="text-lg text-slate-300 mb-6">
                                <span className="font-semibold text-white">Scattered Context:</span> Your company knowledge is spread across
                                Slack threads, GitHub issues, email chains, and meeting notes. There's no single source of truth.
                            </p>
                            <p className="text-lg text-slate-300">
                                <span className="font-semibold text-white">Slow Onboarding:</span> New team members spend weeks catching up on
                                "tribal knowledge" because decisions and their reasoning aren't documented.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                                <p className="text-red-200 font-semibold">❌ Before AHB26</p>
                                <p className="text-sm text-red-100 mt-2">Developer asks: {String.fromCharCode(34)}Why did we choose this?{String.fromCharCode(34)} Nobody knows.</p>
                            </div>
                            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                                <p className="text-green-200 font-semibold">✅ With AHB26</p>
                                <p className="text-sm text-green-100 mt-2">Developer asks: {String.fromCharCode(34)}Why did we choose this?{String.fromCharCode(34)} Gets full decision memo with Slack discussion + GitHub commits + original email.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="mx-auto max-w-6xl px-6 py-20 md:py-32">
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Unify Your Context?</h2>
                    <p className="text-xl text-slate-300 mb-8">Start free. No credit card required. Takes 2 minutes to set up.</p>
                    <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                        <button className="px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition">
                            Get Started Free
                        </button>
                    </SignUpButton>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-700/50 bg-slate-900/50 py-8">
                <div className="mx-auto max-w-6xl px-6 text-center text-slate-400">
                    <p>&copy; 2026 AHB26. All rights reserved.</p>
                </div>
            </footer>
        </main>
    );
}