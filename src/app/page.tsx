"use client";

import { useEffect, useMemo, useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { DecisionMemo } from "@/components/DecisionMemo";

type ApiResult = {
  ok: boolean;
  [key: string]: unknown;
};

type DashboardStats = {
  companyName: string;
  userId?: string;
  readiness: Record<string, boolean>;
  corpus: {
    totalChunks: number;
    latestIngestedAt: string | null;
  };
  sources: Array<{
    source_type: string;
    count: number;
    latest_at: string | null;
  }>;
};

type SyncResult = ApiResult & {
  userId?: string;
  totalIngested?: number;
  hardLinksCreated?: number;
  conflictLinksCreated?: number;
  reasoningTraces?: number;
  report?: {
    topUndocumentedDecisions: Array<{
      id: string;
      title: string;
      source_type: string;
      author: string | null;
      occurred_at: string | null;
    }>;
    recentCrossLinks: Array<{
      source_title: string;
      target_title: string;
      link_type: string;
      similarity: number;
      explanation: string;
    }>;
  };
};

async function postJson(
  url: string,
  payload: Record<string, unknown>,
  userId: string,
): Promise<ApiResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export default function Home() {
  const [userId, setUserId] = useState("demo-user");
  const [question, setQuestion] = useState(
    "What changed in the company this week, and why?",
  );
  const [queryResult, setQueryResult] = useState<ApiResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [manualSourceType, setManualSourceType] = useState<"support" | "meeting">("support");
  const [manualTitle, setManualTitle] = useState("Customer escalation: billing issue");
  const [manualContent, setManualContent] = useState(
    "Customer reported a billing mismatch during a support call and the team decided to adjust the rollout plan.",
  );
  const [manualResult, setManualResult] = useState<ApiResult | null>(null);
  const [loadingIngest, setLoadingIngest] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [loadingManual, setLoadingManual] = useState(false);

  useEffect(() => {
    void fetch(`/api/stats?userId=${encodeURIComponent(userId)}`)
      .then((response) => response.json())
      .then((data: DashboardStats & { ok?: boolean }) => {
        if (data?.companyName) {
          setStats(data);
        }
      })
      .catch(() => undefined);
  }, [userId]);

  const memo = useMemo(() => {
    if (!queryResult?.ok || typeof queryResult.memo !== "string") {
      return "No memo yet.";
    }
    return queryResult.memo;
  }, [queryResult]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#f6e7cf_0,#f6e7cf_18%,#f3f7f9_55%,#e9eef5_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <LandingPage />

        <header className="mb-8 rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <p className="mb-2 text-sm uppercase tracking-[0.28em] text-amber-700">Active synthesis engine</p>
          <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
            {stats?.companyName ?? "Decision Engine"}
          </h2>
          <p className="mt-3 max-w-3xl text-slate-700">
            Sync Slack, GitHub, Gmail, support, and meetings into a live decision graph that
            explains why a company decision happened.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Workspace / user id</span>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-amber-400 transition focus:ring"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="demo-user"
              />
            </label>
            <div className="flex items-end">
              <button
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => void fetch(`/api/stats?userId=${encodeURIComponent(userId)}`).then((response) => response.json()).then((data: DashboardStats & { ok?: boolean }) => {
                  if (data?.companyName) {
                    setStats(data);
                  }
                })}
              >
                Refresh workspace
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <MetricCard label="Events tracked" value={stats?.corpus.totalChunks ?? 0} tone="dark" />
          <MetricCard label="Slack ready" value={stats?.readiness.slack ? "Yes" : "No"} />
          <MetricCard label="Support ready" value={stats?.readiness.support ? "Yes" : "No"} />
          <MetricCard label="Latest ingest" value={stats?.corpus.latestIngestedAt ?? "None"} />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">1) One-Click Sync</h2>
            <p className="mb-4 text-sm text-slate-600">
              Pull the last 30 days of Slack, GitHub, and Gmail into a decision graph, then surface
              a company health report immediately after sync.
            </p>
            <button
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              onClick={async () => {
                setLoadingIngest(true);
                setSyncResult(await postJson("/api/onboarding/sync", { userId }, userId));
                setLoadingIngest(false);
              }}
              disabled={loadingIngest}
            >
              {loadingIngest ? "Syncing..." : "Sync Company"}
            </button>
            <pre className="mt-4 max-h-60 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">
              {JSON.stringify(syncResult, null, 2)}
            </pre>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">2) Ask Why</h2>
            <textarea
              className="h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none ring-amber-400 transition focus:ring"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button
              className="mt-4 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
              onClick={async () => {
                setLoadingQuery(true);
                setQueryResult(await postJson("/api/query/decision", { question, userId }, userId));
                setLoadingQuery(false);
              }}
              disabled={loadingQuery}
            >
              {loadingQuery ? "Synthesizing..." : "Generate Decision Memo"}
            </button>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Corporate wedge</p>
              <p className="mt-2">
                The product answers the question every manager asks: what changed, who said what,
                and what action followed.
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                Decision graph mode • hard links • reasoning trace • conflict watcher
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">3) Add Support or Meeting Notes</h2>
            <p className="mb-4 text-sm text-slate-600">
              This is the corporate expansion path: drop in customer escalations or meeting
              transcripts so the system can connect them to product and engineering decisions.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-300 bg-white p-3 text-sm"
                value={manualSourceType}
                onChange={(event) => setManualSourceType(event.target.value as "support" | "meeting")}
              >
                <option value="support">Support ticket</option>
                <option value="meeting">Meeting note</option>
              </select>
              <input
                className="rounded-xl border border-slate-300 bg-white p-3 text-sm"
                value={manualTitle}
                onChange={(event) => setManualTitle(event.target.value)}
                placeholder="Title"
              />
            </div>
            <textarea
              className="mt-3 h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none ring-amber-400 transition focus:ring"
              value={manualContent}
              onChange={(event) => setManualContent(event.target.value)}
            />
            <button
              className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              onClick={async () => {
                setLoadingManual(true);
                setManualResult(
                  await postJson(
                    "/api/ingest/manual",
                    {
                      sourceType: manualSourceType,
                      records: [
                        {
                          externalId: `${manualSourceType}-${Date.now()}`,
                          title: manualTitle,
                          content: manualContent,
                          metadata: { origin: "manual-demo" },
                        },
                      ],
                      userId,
                    },
                    userId,
                  ),
                );
                setLoadingManual(false);
              }}
              disabled={loadingManual}
            >
              {loadingManual ? "Saving..." : "Save to Memory"}
            </button>
            <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">
              {JSON.stringify(manualResult, null, 2)}
            </pre>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Corporate Features We Can Add Next</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>• Zendesk / Intercom connector for customer support escalations.</li>
              <li>• Meeting transcript ingestion from Zoom, Google Meet, or Loom notes.</li>
              <li>• Workspace-level permissions so each company only sees its own memory graph.</li>
              <li>• Decision trail analytics to show recurring blockers and escalation patterns.</li>
              <li>• Automatic weekly summaries on what changed for executives.</li>
            </ul>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lg">
          <DecisionMemo
            memo={memo}
            userId={userId}
            evidenceCount={Array.isArray(queryResult?.evidence) ? queryResult.evidence.length : 0}
            linkedTopics={syncResult?.report?.recentCrossLinks?.map((link) => `${link.source_title} → ${link.target_title}`) ?? []}
            report={syncResult?.report}
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: string | number;
  tone?: "light" | "dark";
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-lg ${tone === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
      <p className={`text-xs uppercase tracking-[0.24em] ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}
