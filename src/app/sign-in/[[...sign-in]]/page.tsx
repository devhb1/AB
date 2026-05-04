import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-[#f6f6f5] px-6 py-16 text-slate-900">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center pt-12">
                <div className="mb-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">AHB26</p>
                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-black">Sign in</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Access your dashboard, create workspaces, and connect your team sources.
                    </p>
                </div>

                <div className="relative w-full">
                    <div className="absolute -inset-x-6 -inset-y-6 -z-10 mx-auto h-full max-w-4xl rounded-4xl bg-white/60 blur-3xl"></div>

                    <div className="w-full rounded-3xl border border-slate-200 bg-white p-12 shadow-[0_60px_140px_rgba(2,6,23,0.14)]">
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
        </div>
    );
}
