import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--foreground)]">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center pt-12">
                <div className="mb-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">AHB26</p>
                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Sign in</h1>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Access your dashboard, create workspaces, and connect your team sources.
                    </p>
                </div>

                <div className="relative w-full">
                    <div className="absolute -inset-x-6 -inset-y-6 -z-10 mx-auto h-full max-w-4xl rounded-4xl bg-[var(--surface)] blur-3xl"></div>

                    <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-12 shadow-[var(--shadow-strong)]">
                        <SignIn
                            routing="path"
                            path="/sign-in"
                            signUpUrl="/sign-up"
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
        </div>
    );
}
