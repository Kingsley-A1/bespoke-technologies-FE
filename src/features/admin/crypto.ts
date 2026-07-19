import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * At-rest encryption for enrolled TOTP secrets. The key is derived from
 * ADMIN_CODE_PEPPER so no additional secret needs provisioning; rotating the
 * pepper invalidates stored authenticators (admins re-enroll with the
 * registration code).
 */
function encryptionKey() {
  const pepper = process.env.ADMIN_CODE_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_CODE_PEPPER is required.");
  }
  return createHash("sha256")
    .update(`${pepper ?? "bespoke-admin-local-development-code-pepper"}:totp-secret-encryption`)
    .digest();
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptTotpSecret(payload: string): string | null {
  try {
    const [iv, tag, ciphertext] = payload.split(".");
    if (!iv || !tag || !ciphertext) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** 160-bit random secret, base32-encoded for authenticator apps. */
export function generateTotpSecret() {
  const bytes = randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let secret = "";
  for (let index = 0; index + 5 <= bits.length; index += 5) {
    secret += BASE32_ALPHABET[Number.parseInt(bits.slice(index, index + 5), 2)];
  }
  return secret;
}

export function totpProvisioningUri(email: string, secret: string) {
  const issuer = encodeURIComponent("Bespoke Technologies");
  const label = encodeURIComponent(`Bespoke Admin:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
