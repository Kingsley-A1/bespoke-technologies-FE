// @vitest-environment node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { OwnershipCertificate } from "../types";
import { generateOwnershipCertificatePdf } from "./pdf";

const certificate: OwnershipCertificate = {
  id: "10000000-0000-4000-8000-000000000001",
  certificateNumber: "BT-OWN-2026-0001",
  projectId: "10000000-0000-4000-8000-000000000002",
  clientId: "10000000-0000-4000-8000-000000000003",
  status: "issued",
  owner: { kind: "company", name: "Sample Client Limited", email: "client@example.com" },
  project: {
    name: "Sample Digital Platform",
    type: "Web application",
    description: "A dependable client platform designed, engineered, and delivered by Bespoke Technologies.",
    startDate: "2026-01-05",
    completionDate: "2026-07-20",
    projectLogoKey: "projects/logos/sample.png",
    projectLogoMime: "image/png",
  },
  commercial: {
    mode: "paid",
    amount: 2_500_000,
    currency: "NGN",
    displayPublicly: false,
    invoiceNumber: "BT-INV-2026-0001",
    invoiceTotalIncludesTaxAndDiscounts: true,
  },
  company: {
    name: "Bespoke Technologies",
    website: "www.bespoketech.com.ng",
    phone: "08088071657",
    email: "support@bespoketech.com.ng",
    registrationNumber: "9582429",
    motto: "Engineering the solutions for this, and The Next Generations_",
    address: "",
    ceoName: "Kingsley Maduabuchi",
    ceoTitle: "Founder & CEO",
  },
  ownershipStatement: "Bespoke Technologies certifies that the project described in this certificate was completed and delivered to the named owner according to the governing project agreement.",
  deliveryState: "not_sent",
  issuedAt: "2026-07-26T10:00:00.000Z",
  createdAt: "2026-07-26T09:00:00.000Z",
  updatedAt: "2026-07-26T10:00:00.000Z",
};

describe("ownership certificate PDF", () => {
  it("generates one signed landscape A4 page", async () => {
    const [logo, signature, regular, bold] = await Promise.all([
      readFile(path.join(process.cwd(), "public", "brand", "bespoke-technologies-logo.png")),
      readFile(path.join(process.cwd(), "public", "ceo-signature.png")),
      readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf")),
      readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf")),
    ]);
    const bytes = await generateOwnershipCertificatePdf(certificate, {
      brandLogo: logo.buffer.slice(logo.byteOffset, logo.byteOffset + logo.byteLength) as ArrayBuffer,
      projectLogo: logo.buffer.slice(logo.byteOffset, logo.byteOffset + logo.byteLength) as ArrayBuffer,
      projectLogoMime: "image/png",
      signature: signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer,
      qrCode: logo.buffer.slice(logo.byteOffset, logo.byteOffset + logo.byteLength) as ArrayBuffer,
      regularFont: regular.buffer.slice(regular.byteOffset, regular.byteOffset + regular.byteLength) as ArrayBuffer,
      boldFont: bold.buffer.slice(bold.byteOffset, bold.byteOffset + bold.byteLength) as ArrayBuffer,
    });
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(1);
    const size = document.getPage(0).getSize();
    expect(size.width).toBeGreaterThan(size.height);
    expect(document.getTitle()).toContain(certificate.certificateNumber);
    expect(bytes.byteLength).toBeGreaterThan(20_000);
  }, 15_000);
});
