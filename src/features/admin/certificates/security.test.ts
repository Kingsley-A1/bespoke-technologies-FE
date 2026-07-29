import { describe, expect, it } from "vitest";
import {
  createCertificateToken,
  formatCertificateToken,
  hashCertificateToken,
  isCertificateToken,
  normalizeCertificateToken,
} from "./security";

describe("certificate verification tokens", () => {
  it("creates 128-bit human-readable tokens and stores a deterministic hash", () => {
    const first = createCertificateToken();
    const second = createCertificateToken();
    expect(first.token).toMatch(/^[A-F0-9]{32}$/);
    expect(first.tokenHash).toHaveLength(64);
    expect(hashCertificateToken(first.token)).toBe(first.tokenHash);
    expect(second.token).not.toBe(first.token);
  });

  it("formats new codes for print while accepting existing legacy tokens", () => {
    const token = "0123456789ABCDEF0123456789ABCDEF";
    const formatted = "0123-4567-89AB-CDEF-0123-4567-89AB-CDEF";
    expect(formatCertificateToken(token)).toBe(formatted);
    expect(normalizeCertificateToken(formatted)).toBe(token);
    expect(isCertificateToken(formatted)).toBe(true);
    expect(isCertificateToken("Q1lCNXB5X0d4Um1ZMGoxZEVjVEFKMkdDUDBqNlhKeGk")).toBe(true);
    expect(isCertificateToken("predictable")).toBe(false);
  });
});
