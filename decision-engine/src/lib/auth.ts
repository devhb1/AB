import { env } from "@/lib/config";

export function assertIngestionAuth(request: Request): void {
    if (!env.INGESTION_SHARED_SECRET) {
        return;
    }

    const incoming = request.headers.get("x-ingestion-secret");
    if (incoming !== env.INGESTION_SHARED_SECRET) {
        throw new Error("Unauthorized ingestion request");
    }
}
