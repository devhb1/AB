export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Decision Engine</p>
                <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                    The page you&apos;re looking for does not exist in this workspace.
                </p>
            </div>
        </main>
    );
}