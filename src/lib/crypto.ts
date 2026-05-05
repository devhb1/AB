import crypto from "crypto";
import { env } from "@/lib/config";

/**
 * Simple token encryption layer.
 * Encrypts tokens at rest using AES-256-GCM with a key derived from env.ENCRYPTION_KEY.
 * In production, use AWS KMS, Azure Key Vault, or similar.
 */

const ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    // Use ENCRYPTION_KEY from env; fallback to a stable but insecure key for MVP
    const keyMaterial = env.ENCRYPTION_KEY || "fallback-insecure-key-for-mvp-only";
    // Derive a 32-byte (256-bit) key using SHA-256
    return crypto.createHash("sha256").update(keyMaterial).digest();
}

export function encryptToken(token: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // GCM typically uses 96-bit IV

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: salt (16) + iv (12) + authTag (16) + encrypted (variable)
    // salt is generated and included in the encrypted blob for potential future key derivation use
    const salt = crypto.randomBytes(SALT_LENGTH);
    return Buffer.concat([salt, iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(encryptedToken: string): string {
    try {
        const key = getEncryptionKey();
        const buffer = Buffer.from(encryptedToken, "base64");

        // Extract components
        const salt = buffer.slice(0, SALT_LENGTH);
        const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + 12);
        const authTag = buffer.slice(SALT_LENGTH + 12, SALT_LENGTH + 12 + TAG_LENGTH);
        const encrypted = buffer.slice(SALT_LENGTH + 12 + TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString("utf8");
    } catch (err) {
        throw new Error(`Failed to decrypt token: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
}
