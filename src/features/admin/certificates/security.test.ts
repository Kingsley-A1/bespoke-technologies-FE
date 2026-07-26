import { describe, expect, it } from "vitest";
import { createCertificateToken, hashCertificateToken } from "./security";

describe("certificate verification tokens", () => {
  it("creates high-entropy URL-safe tokens and stores a deterministic hash", () => {
    const first = createCertificateToken();
    const second = createCertificateToken();
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{40,80}$/);
    expect(first.tokenHash).toHaveLength(64);
    expect(hashCertificateToken(first.token)).toBe(first.tokenHash);
    expect(second.token).not.toBe(first.token);
  });
});

