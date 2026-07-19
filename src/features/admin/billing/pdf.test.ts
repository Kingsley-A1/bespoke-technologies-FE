// @vitest-environment node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { SAMPLE_DOCUMENT, SAMPLE_PAYMENTS } from "./pdf.fixture";
import { generateBillingPdf } from "./pdf";

describe("billing PDF regression", () => {
  it("generates a readable one-page A4 document with the approved brand asset", async () => {
    const document = SAMPLE_DOCUMENT;
    const [logo, regularFont, boldFont] = await Promise.all([
      readFile(path.join(process.cwd(), "public", "brand", "bespoke-technologies-logo.png")),
      readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf")),
      readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf")),
    ]);
    const bytes = await generateBillingPdf(document, SAMPLE_PAYMENTS, {
      logo: logo.buffer.slice(logo.byteOffset, logo.byteOffset + logo.byteLength) as ArrayBuffer,
      regularFont: regularFont.buffer.slice(regularFont.byteOffset, regularFont.byteOffset + regularFont.byteLength) as ArrayBuffer,
      boldFont: boldFont.buffer.slice(boldFont.byteOffset, boldFont.byteOffset + boldFont.byteLength) as ArrayBuffer,
    });
    const parsed = await PDFDocument.load(bytes);
    const [page] = parsed.getPages();

    expect(bytes.byteLength).toBeGreaterThan(100_000);
    expect(parsed.getPageCount()).toBe(1);
    expect(page.getWidth()).toBeCloseTo(595.28, 1);
    expect(page.getHeight()).toBeCloseTo(841.89, 1);
  });
});
