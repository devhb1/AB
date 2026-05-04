"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { LandingPage } from "@/components/LandingPage";
import { DecisionMemo } from "@/components/DecisionMemo";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";

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

type AccountRecord = {
  id: string;
  name: string;
  email: string;
};

type WorkspaceRecord = {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  description: string | null;
};

type ConnectorProvider = "slack" | "github" | "gmail";

type WorkspaceType = {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  description: string | null;
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

async function getJson(url: string): Promise<ApiResult> {
  const response = await fetch(url);
  return response.json();
}

function HomeContent() {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [accountName, setAccountName] = useState("Harshit");
  const [accountEmail, setAccountEmail] = useState("harshit@example.com");
  const [accountId, setAccountId] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Decision Engine");
  const [workspaceSlug, setWorkspaceSlug] = useState("decision-engine");
  const [workspaceDescription, setWorkspaceDescription] = useState("Company memory and decision reconstruction workspace");
  const [userId, setUserId] = useState("demo-user");
  const [slackChannels, setSlackChannels] = useState("C01234567");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [gmailQuery, setGmailQuery] = useState("newer_than:30d");
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
  const [setupResult, setSetupResult] = useState<ApiResult | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [loadingConnectors, setLoadingConnectors] = useState<Record<ConnectorProvider, boolean>>({
    slack: false,
    github: false,
    gmail: false,
  });
  const [loadingIngest, setLoadingIngest] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [loadingManual, setLoadingManual] = useState(false);

  useEffect(() => {
    const storedAccountId = window.localStorage.getItem("decision-engine-account-id") ?? "";
    const storedAccountName = window.localStorage.getItem("decision-engine-account-name") ?? "";
    const storedAccountEmail = window.localStorage.getItem("decision-engine-account-email") ?? "";
    const queryWorkspaceId = searchParams.get("workspace");
    const storedWorkspaceId = (queryWorkspaceId || window.localStorage.getItem("decision-engine-workspace-id")) ?? "";
    const storedWorkspaceName = window.localStorage.getItem("decision-engine-workspace-name") ?? "";
    const storedWorkspaceSlug = window.localStorage.getItem("decision-engine-workspace-slug") ?? "";
    const storedSlackChannels = window.localStorage.getItem("decision-engine-slack-channels") ?? "";
    const storedGithubOwner = window.localStorage.getItem("decision-engine-github-owner") ?? "";
    const storedGithubRepo = window.localStorage.getItem("decision-engine-github-repo") ?? "";
    const storedGmailQuery = window.localStorage.getItem("decision-engine-gmail-query") ?? "";

    setAccountId(storedAccountId);
    setAccountName(storedAccountName || accountName);
    setAccountEmail(storedAccountEmail || accountEmail);
    setUserId(storedWorkspaceId || userId);
    setWorkspaceName(storedWorkspaceName || workspaceName);
    setWorkspaceSlug(storedWorkspaceSlug || workspaceSlug);
    setSlackChannels(storedSlackChannels || slackChannels);
    setGithubOwner(storedGithubOwner || githubOwner);
    setGithubRepo(storedGithubRepo || githubRepo);
    setGmailQuery(storedGmailQuery || gmailQuery);

    // Load workspaces if we have an account ID
    if (storedAccountId) {
      void fetch(`/api/workspaces?accountId=${encodeURIComponent(storedAccountId)}`)
        .then((response) => response.json())
        .then((data: ApiResult & { workspaces?: WorkspaceType[] }) => {
          if (data.ok && data.workspaces) {
            setWorkspaces(data.workspaces);
          }
        })
        .catch(() => undefined);
    }

    void fetch(`/api/stats?workspaceId=${encodeURIComponent(storedWorkspaceId || userId)}`)
      .then((response) => response.json())
      .then((data: DashboardStats & { ok?: boolean }) => {
        if (data?.companyName) {
          setStats(data);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem("decision-engine-account-id", accountId);
    window.localStorage.setItem("decision-engine-account-name", accountName);
    window.localStorage.setItem("decision-engine-account-email", accountEmail);
    window.localStorage.setItem("decision-engine-workspace-id", userId);
    window.localStorage.setItem("decision-engine-workspace-name", workspaceName);
    window.localStorage.setItem("decision-engine-workspace-slug", workspaceSlug);
    window.localStorage.setItem("decision-engine-slack-channels", slackChannels);
    window.localStorage.setItem("decision-engine-github-owner", githubOwner);
    window.localStorage.setItem("decision-engine-github-repo", githubRepo);
    window.localStorage.setItem("decision-engine-gmail-query", gmailQuery);
  }, [accountId, accountName, accountEmail, userId, workspaceName, workspaceSlug, slackChannels, githubOwner, githubRepo, gmailQuery]);

  async function refreshStats(workspaceScope = userId) {
    const data = await getJson(`/api/stats?workspaceId=${encodeURIComponent(workspaceScope)}`);
    if (data?.companyName) {
      setStats(data as unknown as DashboardStats);
    }
  }

  async function createAccount() {
    setLoadingAccount(true);
    const result = await postJson("/api/accounts", { name: accountName, email: accountEmail }, userId);
    if (result.ok && result.account) {
      const account = result.account as AccountRecord;
      setAccountId(account.id);
      window.localStorage.setItem("decision-engine-account-id", account.id);
      setSetupResult(result);
    } else {
      setSetupResult(result);
    }
    setLoadingAccount(false);
  }

  async function createWorkspace() {
    if (!accountId) {
      setSetupResult({ ok: false, error: "Create an account first" });
      return;
    }
    setLoadingWorkspace(true);
    const result = await postJson(
      "/api/workspaces",
      {
        accountId,
        name: workspaceName,
        slug: workspaceSlug,
        description: workspaceDescription,
      },
      userId,
    );
    if (result.ok && result.workspace) {
      const workspace = result.workspace as WorkspaceRecord;
      setUserId(workspace.id);
      setWorkspaceName(workspace.name);
      setWorkspaceSlug(workspace.slug);
      window.localStorage.setItem("decision-engine-workspace-id", workspace.id);
      window.localStorage.setItem("decision-engine-workspace-name", workspace.name);
      window.localStorage.setItem("decision-engine-workspace-slug", workspace.slug);
      await refreshStats(workspace.id);
    }
    setSetupResult(result);
    setLoadingWorkspace(false);
  }

  async function connectProvider(provider: ConnectorProvider) {
    if (!userId) {
      setSetupResult({ ok: false, error: "Create a workspace first" });
      return;
    }

    setLoadingConnectors((current) => ({ ...current, [provider]: true }));
    const config =
      provider === "slack"
        ? { channelIds: slackChannels.split(",").map((item) => item.trim()).filter(Boolean) }
        : provider === "github"
          ? { owner: githubOwner, repo: githubRepo }
          : { query: gmailQuery };

    const result = await postJson(`/api/workspaces/${encodeURIComponent(userId)}/connections`, {
      provider,
      config,
      status: "connected",
    }, userId);

    if (result.ok) {
      await refreshStats(userId);
      setSetupResult(result);
    } else {
      setSetupResult(result);
    }
    setLoadingConnectors((current) => ({ ...current, [provider]: false }));
  }

  const memo = useMemo(() => {
    if (!queryResult?.ok || typeof queryResult.memo !== "string") {
      return "No memo yet.";
    }
    return queryResult.memo;
  }, [queryResult]);

  const showWorkspace = isLoaded && isSignedIn;

  function handleWorkspaceChange(workspaceId: string) {
    window.localStorage.setItem("decision-engine-workspace-id", workspaceId);
    setUserId(workspaceId);
    const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);
    if (selectedWorkspace) {
      setWorkspaceName(selectedWorkspace.name);
      setWorkspaceSlug(selectedWorkspace.slug);
      void refreshStats(workspaceId);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#f6e7cf_0,#f6e7cf_18%,#f3f7f9_55%,#e9eef5_100%)] text-slate-900">
      {showWorkspace && <WorkspaceHeader currentWorkspaceId={userId} workspaces={workspaces} onWorkspaceChange={handleWorkspaceChange} />}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <LandingPage />

        {showWorkspace ? (
          <>
            <section className="mb-8 grid gap-6 rounded-3xl border border-emerald-200/70 bg-emerald-50 p-6 shadow-xl md:grid-cols-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-emerald-700">0) Get started</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Signup, workspace, connectors</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Production flow: create a basic account, create a workspace, connect data sources, then run the first sync.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">1. Account</p>
                <div className="mt-3 grid gap-2">
                  <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Your name" />
                  <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} placeholder="you@company.com" />
                  <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => void createAccount()} disabled={loadingAccount}>{loadingAccount ? "Creating..." : accountId ? "Account saved" : "Create account"}</button>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">2. Workspace</p>
                <div className="mt-3 grid gap-2">
                  <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Workspace name" />
                  <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={workspaceSlug} onChange={(event) => setWorkspaceSlug(event.target.value)} placeholder="workspace-slug" />
                  <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => void createWorkspace()} disabled={loadingWorkspace || !accountId}>{loadingWorkspace ? "Creating..." : userId !== "demo-user" ? "Workspace saved" : "Create workspace"}</button>
                </div>
              </div>
            </section>

            <section className="mb-8 grid gap-6 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl md:grid-cols-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-amber-700">3) Connect sources</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Bring in the signals</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Save connector metadata now; the sync button will use it to ingest live data and build the graph.
                </p>
                <pre className="mt-4 max-h-36 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-emerald-300">{JSON.stringify(setupResult, null, 2)}</pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Slack</p>
                <input className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={slackChannels} onChange={(event) => setSlackChannels(event.target.value)} placeholder="C01234567,C07654321" />
                <button className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void connectProvider("slack")} disabled={!userId || loadingConnectors.slack}>{loadingConnectors.slack ? "Saving..." : "Connect Slack"}</button>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">GitHub</p>
                <div className="mt-3 grid gap-2">
                  <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={githubOwner} onChange={(event) => setGithubOwner(event.target.value)} placeholder="owner" />
                  <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={githubRepo} onChange={(event) => setGithubRepo(event.target.value)} placeholder="repo" />
                  <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void connectProvider("github")} disabled={!userId || loadingConnectors.github}>{loadingConnectors.github ? "Saving..." : "Connect GitHub"}</button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-3">
                <p className="text-sm font-semibold text-slate-950">Gmail</p>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={gmailQuery} onChange={(event) => setGmailQuery(event.target.value)} placeholder='newer_than:30d' />
                  <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void connectProvider("gmail")} disabled={!userId || loadingConnectors.gmail}>{loadingConnectors.gmail ? "Saving..." : "Connect Gmail"}</button>
                </div>
              </div>
            </section>

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
                  <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Active workspace id</span>
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
                    onClick={() => void refreshStats(userId)}
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
                    setSyncResult(await postJson("/api/onboarding/sync", { userId, workspaceId: userId }, userId));
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
                    setQueryResult(await postJson("/api/query/decision", { question, userId: userId }, userId));
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
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" />}>
      <HomeContent />
    </Suspense>
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
