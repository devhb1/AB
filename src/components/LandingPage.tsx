"use client";

import { useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

const clerkEnabled = typeof window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const featureCards = [
    {
        title: "Autonomous ingestion",
        description: "Zero manual entry. We live in your stack.",
    },
    {
        title: "Decision attribution",
        description: "Know who said what, where, and why instantly.",
    },
    {
        title: "Context-aware search",
        description: "Search code by intent, not keywords.",
    },
    {
        title: "Security-first",
        description: "PII redaction before vector storage, with self-hosted and SOC2-ready paths.",
    },
];

function TimelineNode({
    label,
    title,
    detail,
    accent,
}: {
    label: string;
    title: string;
    detail: string;
    accent: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-lg shadow-black/20">
            <p className={`text-[0.65rem] uppercase tracking-[0.28em] ${accent}`}>{label}</p>
            <p className="mt-2 text-lg font-semibold">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
        </div>
    );
}

export function LandingPage() {
    const [clicked, setClicked] = useState(false);

    const handleDemoMode = () => {
        setClicked(true);
        window.localStorage.setItem("decision-engine-demo-mode", "true");
        setTimeout(() => window.location.reload(), 100);
    };

    return (
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-2xl shadow-slate-300/40">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="border-b border-slate-200/70 p-8 lg:border-b-0 lg:border-r lg:p-10">
                    <p className="text-sm uppercase tracking-[0.4em] text-orange-700">YC War Room</p>
                    <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                        Your Company&apos;s Brain, Deciphered.
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                        Engineering moves fast. Documentation moves slow. Context dies in Slack.
                        Decision Engine turns Slack, GitHub, Gmail, and support threads into a living
                        decision graph.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        {clerkEnabled ? (
                            <>
                                <SignUpButton mode="modal" fallbackRedirectUrl="/">
                                    <button className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                                        Get started
                                    </button>
                                </SignUpButton>
                                <SignInButton mode="modal" fallbackRedirectUrl="/">
                                    <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                        Log in
                                    </button>
                                </SignInButton>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleDemoMode}
                                    disabled={clicked}
                                    className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                                >
                                    {clicked ? "Launching..." : "Get started (Demo)"}
                                </button>
                                <a
                                    href="#setup"
                                    className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 inline-block"
                                >
                                    Setup Clerk
                                </a>
                            </>
                        )}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                            Sync your company in 60 seconds
                        </span>
                        <span className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                            Printable decision memos
                        </span>
                        <span className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                            PII redaction before vector storage
                        </span>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-2">
                        {featureCards.map((card) => (
                            <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-semibold text-slate-950">{card.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
                        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">The problem</p>
                        <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-200">
                            We solve knowledge debt: the loss of context when teams move fast and nobody can
                            remember why the last deployment failed.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-950 p-8 lg:p-10">
                    <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Visual timeline</p>
                    <div className="mt-6 space-y-4">
                        <TimelineNode
                            label="Gmail"
                            title="Client request lands"
                            detail="A customer email asks for a rollout change and flags a billing mismatch."
                            accent="text-cyan-300"
                        />
                        <div className="ml-6 h-10 w-px bg-gradient-to-b from-cyan-300 to-slate-700" />
                        <TimelineNode
                            label="Slack"
                            title="Team aligns in #dev-core"
                            detail="The CTO and engineering lead discuss the tradeoff and agree on a safer rollout path."
                            accent="text-orange-300"
                        />
                        <div className="ml-6 h-10 w-px bg-gradient-to-b from-orange-300 to-slate-700" />
                        <TimelineNode
                            label="GitHub"
                            title="PR lands with reasoning trace"
                            detail="A follow-up commit is linked to the email and Slack thread, so the Why is preserved forever."
                            accent="text-emerald-300"
                        />
                    </div>

                    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                        <p className="font-semibold text-white">Security and privacy</p>
                        <p className="mt-2 leading-7">
                            Self-hosted options and SOC2-ready data isolation. Sensitive data is redacted before
                            it reaches the vector database.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}