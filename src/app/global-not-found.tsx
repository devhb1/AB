export default function GlobalNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Decision Engine</p>
        <h1 className="mt-4 text-3xl font-semibold">Not found (global)</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          The requested resource could not be found.
        </p>
      </div>
    </main>
  );
}
export default function GlobalNotFound() {
    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
                <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#020617", color: "white", padding: "24px" }}>
                    <div style={{ maxWidth: "560px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "32px", textAlign: "center", background: "rgba(255,255,255,0.04)" }}>
                        <p style={{ letterSpacing: "0.35em", textTransform: "uppercase", color: "#67e8f9", fontSize: "12px" }}>Decision Engine</p>
                        <h1 style={{ fontSize: "36px", margin: "16px 0 0" }}>Page not found</h1>
                        <p style={{ marginTop: "12px", lineHeight: 1.7, color: "#cbd5e1", fontSize: "14px" }}>
                            This route does not exist in the current workspace.
                        </p>
                    </div>
                </main>
            </body>
        </html>
    );
}