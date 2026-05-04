import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAccount } from "@/lib/db";

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
        const account = await createAccount({
            id: crypto.randomUUID(),
            name: input.name,
            email: input.email,
        });

        return NextResponse.json({ ok: true, account });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Account creation error:", error);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
