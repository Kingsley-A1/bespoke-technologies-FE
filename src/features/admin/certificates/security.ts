import { createHash, randomBytes } from "node:crypto";

export function createCertificateToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashCertificateToken(token) };
}

export function hashCertificateToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

