import { NextResponse } from "next/server";
import { assertRecentAdminPermission } from "@/features/admin/access";
import { adminExportCsv, appendAudit, getAdminSnapshot } from "@/features/admin/repository";

export async function GET() {
  const access = await assertRecentAdminPermission("exports.all");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const snapshot = await getAdminSnapshot();
  const csv = adminExportCsv(snapshot);
  await appendAudit(access.session, "company.export.created", "company_export", undefined, "Founder generated a controlled CSV export.", { rows: csv.split("\n").length - 1 });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bespoke-admin-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
