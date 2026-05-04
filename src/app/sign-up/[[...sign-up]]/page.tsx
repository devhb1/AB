import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#0f172a_0,#020617_45%,#020617_100%)] px-6 py-12 text-white">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">AHB26</p>
                <h1 className="mt-4 text-3xl font-semibold">Create your account</h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                    Start with a basic account, create a workspace, and connect your company sources.
                </p>
                <div className="mt-8 rounded-2xl bg-white p-3 text-slate-900">
                    <SignUp
                        routing="path"
                        path="/sign-up"
                        signInUrl="/sign-in"
                        forceRedirectUrl="/"
                        fallbackRedirectUrl="/"
                    />
                </div>
            </div>
        </div>
    );
}
