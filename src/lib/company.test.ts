import { describe, expect, it } from "vitest";
import { COMPANY_IDENTITY, documentVerificationUrl } from "./company";

describe("authoritative company identity", () => {
  it("contains the approved signatory and official verification URL", () => {
    expect(COMPANY_IDENTITY.ceoName).toBe("Kingsley Maduabuchi");
    expect(documentVerificationUrl("bt-own-2026-0002", "0123456789ABCDEF")).toBe(
      "https://verify.bespoketech.com.ng/BT-OWN-2026-0002/0123456789ABCDEF",
    );
  });
});
