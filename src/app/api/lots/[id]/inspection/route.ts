import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

const GRADES = ["A", "B", "C"];

// Record the human inspection result (grade + note); the system never grades the fish itself.
// After the lot has trades the change is still allowed but kept in the audit log with a reason.
export async function POST(request: Request, ctx: RouteContext<"/api/lots/[id]/inspection">) {
  const { id } = await ctx.params;
  return guard("lots.inspect", async (g) => {
    const b = await readJson<{ grade: string; note?: string; reason?: string }>(request);
    if (!GRADES.includes(b.grade)) throw new ApiError(400, "Chọn hạng A, B hoặc C");
    const before = check(await g.db.from("lots").select("*").eq("id", id).single());
    const traded = check(await g.db.from("trades").select("id").eq("lot_id", id).limit(1)).length > 0;
    if (traded && !b.reason?.trim()) throw new ApiError(400, "Lô đã có giao dịch: phải nhập lý do sửa kết quả đánh giá");
    const after = check(await g.db.from("lots").update({
      grade: b.grade,
      inspection_note: b.note?.trim() || null,
      inspected_by: g.user.id,
      inspected_at: new Date().toISOString(),
      status: before.status === "received" ? "inspected" : before.status,
    }).eq("id", id).select("*").single());
    await writeAuditLog(g, { action: "inspect", entity: "lot", entityId: id, before, after, reason: b.reason });
    return Response.json(after);
  });
}
