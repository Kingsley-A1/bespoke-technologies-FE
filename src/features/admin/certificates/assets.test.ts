// @vitest-environment node

import { describe, expect, it } from "vitest";
import type { OwnershipCertificate } from "../types";
import { loadCertificatePdfAssets } from "./assets";

const portfolioCertificate: OwnershipCertificate = {
  id: "10000000-0000-4000-8000-000000000001",
  certificateNumber: "BT-OWN-2026-0001",
  portfolioProjectId: "maxit-autos",
  status: "draft",
  owner: { kind: "company", name: "Maxit Autos Limited" },
  project: {
    name: "Maxit Autos",
    type: "web+mobile",
    description: "A digital automotive marketplace.",
    startDate: "2026-01-10",
    completionDate: "2026-07-20",
    portfolioProjectId: "maxit-autos",
    projectLogoUrl: "/projects/maxit_autos_logo.png",
  },
  commercial: {
    mode: "undisclosed",
    displayPublicly: false,
  },
  company: {
    name: "Bespoke Technologies",
    website: "www.bespoketech.com.ng",
    phone: "08088071657",
    email: "support@bespoketech.com.ng",
    registrationNumber: "9582429",
    motto: "Engineering the solutions for this, and The Next Generations_",
    address: "",
    ceoName: "Kingsley Maduchi",
    ceoTitle: "Founder & CEO",
  },
  ownershipStatement: "Bespoke Technologies certifies that this project was completed and delivered to the named legal owner.",
  deliveryState: "not_sent",
  createdAt: "2026-07-26T09:00:00.000Z",
  updatedAt: "2026-07-26T09:00:00.000Z",
};

describe("certificate PDF assets", () => {
  it("loads a local portfolio logo and the saved CEO signature", async () => {
    const assets = await loadCertificatePdfAssets(
      portfolioCertificate,
      "https://www.bespoketech.com.ng/ownership/verify/test-token",
    );

    expect(assets.projectLogoMime).toBe("image/png");
    expect(assets.projectLogo.byteLength).toBeGreaterThan(1_000);
    expect(assets.signature?.byteLength).toBeGreaterThan(1_000);
    expect(assets.qrCode.byteLength).toBeGreaterThan(1_000);
  });
});
