import { createHash, randomBytes } from "node:crypto";

export function createCertificateToken() {
  const token = randomBytes(16).toString("hex").toUpperCase();
  return { token, tokenHash: hashCertificateToken(token) };
}

export function hashCertificateToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeCertificateToken(value: string) {
  const trimmed = value.trim();
  if (/^(?:[A-Fa-f0-9]{4}-?){8}$/.test(trimmed)) {
    return trimmed.replaceAll("-", "").toUpperCase();
  }
  return trimmed;
}

export function isCertificateToken(value: string) {
  const token = normalizeCertificateToken(value);
  return /^[A-F0-9]{32}$/.test(token) || /^[A-Za-z0-9_-]{40,80}$/.test(token);
}

export function formatCertificateToken(value: string) {
  const token = normalizeCertificateToken(value);
  return /^[A-F0-9]{32}$/.test(token)
    ? token.match(/.{1,4}/g)?.join("-") ?? token
    : token;
}
