// @vitest-environment node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { DEFAULT_PAYMENT_TERMS } from "../billing/document-copy";
import { generateBillingPdf } from "../billing/pdf";
import { generateOwnershipCertificatePdf } from "../certificates/pdf";
import { DEFAULT_OWNERSHIP_STATEMENT } from "../certificates/constants";
import { COMPANY_SETTINGS, officialCompanySnapshot } from "../config";
import type { BillingDocument, OwnershipCertificate } from "../types";
import { THIRD_PARTY_INFRASTRUCTURE_NOTICE, documentVerificationUrl } from "@/lib/company";

function arrayBuffer(value: Uint8Array) {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

const outputDirectory = process.env.DOCUMENT_VISUAL_OUTPUT;

describe.skipIf(!outputDirectory)("official document visual fixtures", () => {
  it("writes representative invoice and certificate PDFs for visual inspection", async () => {
    const [logo, signature, regular, bold] = await Promise.all([
      readFile(path.join(process.cwd(), "public", "brand", "bespoke-technologies-logo.png")),
      readFile(path.join(process.cwd(), "public", "ceo-signature.png")),
      readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf")),
      readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf")),
    ]);
    const certificateNumber = "BT-OWN-2026-0002";
    const company = officialCompanySnapshot(COMPANY_SETTINGS);
    const certificate: OwnershipCertificate = {
      id: "10000000-0000-4000-8000-000000000001",
      certificateNumber,
      status: "issued",
      owner: { kind: "company", name: "Sample Faith Organization" },
      project: {
        name: "Community Digital Platform",
        type: "web_app",
        description: "A secure community platform designed, engineered, and delivered by Bespoke Technologies. To the Glory of Jesus.",
        startDate: "2026-01-05",
        completionDate: "2026-07-28",
      },
      commercial: {
        mode: "donation",
        amount: 0,
        currency: "NGN",
        displayPublicly: false,
        valueLabel: "But Jesus Paid It All.",
      },
      company,
      ownershipStatement: DEFAULT_OWNERSHIP_STATEMENT,
      deliveryState: "not_sent",
      issuedAt: "2026-07-28T10:00:00.000Z",
      createdAt: "2026-07-28T09:00:00.000Z",
      updatedAt: "2026-07-28T10:00:00.000Z",
    };
    const qr = await QRCode.toBuffer(documentVerificationUrl(certificateNumber), {
      type: "png",
      width: 320,
      margin: 1,
    });
    const certificatePdf = await generateOwnershipCertificatePdf(certificate, {
      brandLogo: arrayBuffer(logo),
      projectLogo: arrayBuffer(logo),
      projectLogoMime: "image/png",
      signature: arrayBuffer(signature),
      qrCode: arrayBuffer(qr),
      regularFont: arrayBuffer(regular),
      boldFont: arrayBuffer(bold),
    });

    const invoice: BillingDocument = {
      id: "40000000-0000-4000-8000-000000000002",
      documentNumber: "BT-OTH-2026-0001",
      type: "other",
      customTypeLabel: "Donation Acknowledgement Invoice",
      status: "sent",
      clientId: "10000000-0000-4000-8000-000000000002",
      client: {
        name: "Sample Faith Organization",
        contactName: "Project Coordinator",
        email: "client@example.com",
        phone: "08000000000",
        address: "Calabar, Nigeria",
      },
      company,
      issueDate: "2026-07-28",
      dueDate: "2026-07-28",
      currency: "NGN",
      items: [{
        id: "item-1",
        name: "Community digital platform",
        description: "Completed project delivery and handover.",
        quantity: 1,
        rate: 0,
        discountRate: 0,
        taxRate: 0,
      }],
      notes: "To the Glory of Jesus.",
      terms: DEFAULT_PAYMENT_TERMS,
      paymentInstructions: THIRD_PARTY_INFRASTRUCTURE_NOTICE,
      purchaseOrder: "",
      valueLabel: "But Jesus Paid It All.",
      revision: 1,
      issuedAt: "2026-07-28T10:00:00.000Z",
      createdAt: "2026-07-28T09:00:00.000Z",
      updatedAt: "2026-07-28T10:00:00.000Z",
    };
    const invoicePdf = await generateBillingPdf(invoice, [], {
      logo: arrayBuffer(logo),
      regularFont: arrayBuffer(regular),
      boldFont: arrayBuffer(bold),
    });

    await mkdir(outputDirectory!, { recursive: true });
    await Promise.all([
      writeFile(path.join(outputDirectory!, "ownership-certificate.pdf"), certificatePdf),
      writeFile(path.join(outputDirectory!, "zero-balance-invoice.pdf"), invoicePdf),
    ]);
    expect(certificatePdf.byteLength).toBeGreaterThan(20_000);
    expect(invoicePdf.byteLength).toBeGreaterThan(100_000);
  }, 20_000);
});
