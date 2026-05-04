import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/config";

const accountSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const result = accountSchema.safeParse(body);

        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            return NextResponse.json(
                {
                    ok: false,
                    error: "Validation failed",
                    details: errors,
                    received: { name: body.name, email: body.email }
                },
                { status: 400 }
            );
        }

        const input = result.data;
        const accountId = crypto.randomUUID();

        if (env.DATABASE_URL) {
            try {
                const { createAccount } = await import("@/lib/db");
                const account = await createAccount({
                    id: accountId,
                    name: input.name,
                    email: input.email,
                });

                return NextResponse.json({ ok: true, account });
            } catch (dbError) {
                console.warn("DATABASE_URL is set but unavailable, falling back to MVP account creation:", dbError);
            }
        }

        return NextResponse.json({
            ok: true,
            account: {
                id: accountId,
                name: input.name,
                email: input.email,
                created_at: new Date().toISOString(),
            },
            note: "Account created in MVP mode (database unavailable)",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Account creation error:", error);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
