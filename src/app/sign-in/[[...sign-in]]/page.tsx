import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
            <div className="w-full max-w-md">
                <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    forceRedirectUrl="/dashboard"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
        </div>
    );
}
