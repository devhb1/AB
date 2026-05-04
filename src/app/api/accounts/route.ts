import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAccount } from "@/lib/db";

const accountSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
});

export async function POST(request: NextRequest) {
    try {
        const input = accountSchema.parse(await request.json());
        const account = await createAccount({
            id: crypto.randomUUID(),
            name: input.name,
            email: input.email,
        });

        return NextResponse.json({ ok: true, account });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
