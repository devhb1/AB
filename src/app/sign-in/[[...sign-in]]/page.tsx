import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-[#fbfaf7] px-6 py-12 text-slate-900">
            <div className="mx-auto flex w-full max-w-md flex-col items-stretch pt-16">
                <div className="mb-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">AHB26</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Access your dashboard, create workspaces, and connect your team sources.
                    </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
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
