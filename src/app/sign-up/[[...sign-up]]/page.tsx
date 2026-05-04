import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--foreground)]">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center pt-12">
                <div className="mb-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">AHB26</p>
                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Create account</h1>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Join AHB26, set up a workspace, and connect Slack, GitHub, and Gmail.
                    </p>
                </div>

                <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-12 shadow-[var(--shadow-strong)]">
                    <SignUp
                        routing="path"
                        path="/sign-up"
                        signInUrl="/sign-in"
                        forceRedirectUrl="/dashboard"
                        fallbackRedirectUrl="/dashboard"
                        appearance={{
                            variables: {
                                colorPrimary: "var(--primary)",
                                colorBackground: "var(--surface)",
                                colorText: "var(--foreground)",
                                colorTextSecondary: "var(--muted)",
                                colorInputBackground: "var(--surface-muted)",
                                colorInputText: "var(--foreground)",
                                colorShimmer: "var(--surface-muted)",
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
