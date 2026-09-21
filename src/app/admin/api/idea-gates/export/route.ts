import { assertAdminPermission } from "@/features/admin/access";
import { exportIdeaGatesCsv } from "@/features/idea-gate/repository";

export async function GET() {
  const access = await assertAdminPermission("idea_gates.export");
  if (!access.ok) {
    return Response.json({ message: access.error }, { status: access.status });
  }
  const csv = await exportIdeaGatesCsv();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="idea-execution-gates-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
