import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(__dirname, "../../..");

function sourceHash(relativePath: string) {
  return createHash("sha256").update(readFileSync(resolve(repositoryRoot, relativePath))).digest("hex").toUpperCase();
}

describe("Bespoke Learn approved identity assets", () => {
  it("keeps both supplied source files byte-identical", () => {
    expect(sourceHash("Learn/Bepsoke-Learn-Logo.png")).toBe("AA0167DF6992D86F058BF84D62566E4D61A854BF5816203F41F1501A594E4F7C");
    expect(sourceHash("Learn/Bespoke-learn-logo-with-name.png")).toBe("C86881D4472770C9181728357B41DBFF9BA97D50692FD8B2B33513D85FECB68E");
  });

  it("serves only the approved compact mark and documented production lockup", () => {
    expect(existsSync(resolve(repositoryRoot, "public/learn/brand/bespoke-learn-mark.png"))).toBe(true);
    expect(existsSync(resolve(repositoryRoot, "public/learn/brand/bespoke-learn-lockup.png"))).toBe(true);
  });

  it("records the deterministic lockup preparation command without inventing a logo variant", () => {
    const script = readFileSync(resolve(repositoryRoot, "scripts/prepare-learn-brand.mjs"), "utf8");
    expect(script).toContain("crop=1070:680:95:270");
    expect(script).toContain("Bespoke-learn-logo-with-name.png");
    expect(script).not.toMatch(/imagegen|svg|trace/i);
  });
});
