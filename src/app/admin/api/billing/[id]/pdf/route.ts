import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/access";
import { generateBillingPdf } from "@/features/admin/billing/pdf";
import { getAdminSnapshot } from "@/features/admin/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("billing.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const id = (await params).id;
  const snapshot = await getAdminSnapshot();
  const document = snapshot.documents.find((candidate) => candidate.id === id);
  if (!document) return NextResponse.json({ error: "Billing document not found" }, { status: 404 });
  const [logo, regularFont, boldFont] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "brand", "bespoke-technologies-logo.png")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf")),
  ]);
  const bytes = await generateBillingPdf(document, snapshot.payments, {
    logo: logo.buffer.slice(logo.byteOffset, logo.byteOffset + logo.byteLength) as ArrayBuffer,
    regularFont: regularFont.buffer.slice(regularFont.byteOffset, regularFont.byteOffset + regularFont.byteLength) as ArrayBuffer,
    boldFont: boldFont.buffer.slice(boldFont.byteOffset, boldFont.byteOffset + boldFont.byteLength) as ArrayBuffer,
  });
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.documentNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
