type DecisionMemoProps = {
    memo: string;
    userId: string;
    evidenceCount: number;
    linkedTopics: string[];
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

export function DecisionMemo({ memo, userId, evidenceCount, linkedTopics, report }: DecisionMemoProps) {
    return (
        <article className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/60 print:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Decision memo</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">The Why, as a document</h3>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p>User: {userId}</p>
                    <p className="mt-1">Evidence blocks: {evidenceCount}</p>
                </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800">{memo}</pre>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-950">Linked topics</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {linkedTopics.length ? linkedTopics.map((topic) => (
                                <span key={topic} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700">
                                    {topic}
                                </span>
                            )) : (
                                <span className="text-sm text-slate-500">No hard links yet.</span>
                            )}
                        </div>
                    </div>

                    {report ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm font-semibold text-emerald-950">Initial insight</p>
                            <ul className="mt-3 space-y-3 text-sm text-emerald-950/90">
                                {report.topUndocumentedDecisions.map((item) => (
                                    <li key={item.id} className="rounded-xl bg-white/70 p-3">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-700">
                                            {item.source_type} • {item.author ?? "unknown"}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </aside>
            </div>

            {report?.recentCrossLinks.length ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">Recent graph links</p>
                    <ul className="mt-3 space-y-3 text-sm text-slate-700">
                        {report.recentCrossLinks.map((link, index) => (
                            <li key={`${link.source_title}-${link.target_title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="font-medium text-slate-950">{link.source_title}</p>
                                <p className="mt-1 text-slate-600">→ {link.target_title}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                                    {link.link_type} • {(link.similarity * 100).toFixed(1)}%
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </article>
    );
}