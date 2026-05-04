"use client";

import { useEffect, useMemo, useState } from "react";

type ApiResult = {
  ok: boolean;
  [key: string]: unknown;
};

type DashboardStats = {
  companyName: string;
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

async function postJson(url: string, payload: Record<string, unknown>): Promise<ApiResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export default function Home() {
  const [question, setQuestion] = useState(
    "What changed in the company this week, and why?",
  );
  const [queryResult, setQueryResult] = useState<ApiResult | null>(null);
  const [ingestResult, setIngestResult] = useState<ApiResult | null>(null);
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
    void fetch("/api/stats")
      .then((response) => response.json())
      .then((data: DashboardStats & { ok?: boolean }) => {
        if (data?.companyName) {
          setStats(data);
        }
      })
      .catch(() => undefined);
  }, []);

  const memo = useMemo(() => {
    if (!queryResult?.ok || typeof queryResult.memo !== "string") {
      return "No memo yet.";
    }
    return queryResult.memo;
  }, [queryResult]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#f6e7cf_0,#f6e7cf_18%,#f3f7f9_55%,#e9eef5_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <p className="mb-2 text-sm uppercase tracking-[0.28em] text-amber-700">YC War Room</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            {stats?.companyName ?? "Decision Engine"}
          </h1>
          <p className="mt-3 max-w-3xl text-slate-700">
            Connect Slack, GitHub, Gmail, support, and meetings, then generate a timeline that
            explains why a company decision happened.
          </p>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <MetricCard label="Events tracked" value={stats?.corpus.totalChunks ?? 0} tone="dark" />
          <MetricCard label="Slack ready" value={stats?.readiness.slack ? "Yes" : "No"} />
          <MetricCard label="Support ready" value={stats?.readiness.support ? "Yes" : "No"} />
          <MetricCard label="Latest ingest" value={stats?.corpus.latestIngestedAt ?? "None"} />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">1) Ingest Sources</h2>
            <p className="mb-4 text-sm text-slate-600">
              Pull latest events from Slack channels, GitHub repo activity, Gmail threads, and
              manual support/meeting notes into Postgres + pgvector.
            </p>
            <button
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              onClick={async () => {
                setLoadingIngest(true);
                setIngestResult(await postJson("/api/ingest/all", {}));
                setLoadingIngest(false);
              }}
              disabled={loadingIngest}
            >
              {loadingIngest ? "Ingesting..." : "Run Ingestion"}
            </button>
            <pre className="mt-4 max-h-60 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">
              {JSON.stringify(ingestResult, null, 2)}
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
                setQueryResult(await postJson("/api/query/decision", { question }));
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
                  await postJson("/api/ingest/manual", {
                    sourceType: manualSourceType,
                    records: [
                      {
                        externalId: `${manualSourceType}-${Date.now()}`,
                        title: manualTitle,
                        content: manualContent,
                        metadata: { origin: "manual-demo" },
                      },
                    ],
                  }),
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
          <h2 className="mb-3 text-xl font-semibold">Decision Memo</h2>
          <article className="prose max-w-none whitespace-pre-wrap text-slate-800">{memo}</article>
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
