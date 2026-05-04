"use client";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error }) {
    useEffect(() => {
        console.error("App error:", error);
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">AHB26</p>
                <h1 className="mt-4 text-3xl font-semibold">Something went wrong</h1>
                <p className="mt-3 text-sm leading-7 text-slate-300">An unexpected error occurred. Please try refreshing the page.</p>
                <button
                    onClick={() => window.location.href = "/"}
                    className="mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
                >
                    Go Home
                </button>
            </div>
        </main>
    );
}
