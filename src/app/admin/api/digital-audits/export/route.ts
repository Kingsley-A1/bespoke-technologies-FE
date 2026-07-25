import { assertAdminPermission } from "@/features/admin/access";
import { exportDigitalAuditsCsv } from "@/features/digital-audits/repository";

export async function GET() {
  const access = await assertAdminPermission("digital_audits.export");
  if (!access.ok) {
    return Response.json({ message: access.error }, { status: access.status });
  }
  const csv = await exportDigitalAuditsCsv();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="digital-audits-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
