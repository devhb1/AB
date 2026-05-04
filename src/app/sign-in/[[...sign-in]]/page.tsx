import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
            <div className="mx-auto flex w-full max-w-lg flex-col items-center pt-20">
                <div className="mb-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">AHB26</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Access your dashboard, create workspaces, and connect your team sources.
                    </p>
                </div>

                <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg ring-1 ring-slate-100">
                    <SignIn
                        routing="path"
                        path="/sign-in"
                        signUpUrl="/sign-up"
                        forceRedirectUrl="/dashboard"
                        fallbackRedirectUrl="/dashboard"
                    />
                </div>
            </div>
        </div>
    );
}
