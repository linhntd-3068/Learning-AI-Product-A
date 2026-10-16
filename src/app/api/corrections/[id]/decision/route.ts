import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

// Approve or reject a correction. Approval posts a reversal entry and a corrected entry on the latest open
// business day; the requester can never approve their own request (checked in the database function).
export async function POST(request: Request, ctx: RouteContext<"/api/corrections/[id]/decision">) {
  const { id } = await ctx.params;
  return guard("corrections.approve", async (g) => {
    const b = await readJson<{ approve: boolean; note?: string }>(request);
    if (typeof b.approve !== "boolean") throw new ApiError(400, "Thiếu quyết định duyệt / từ chối");
    if (!b.approve && !b.note?.trim()) throw new ApiError(400, "Từ chối phải ghi lý do");
    const before = check(await g.db.from("corrections").select("*").eq("id", id).single());
    const after = check(await g.db.rpc("fn_decide_correction", {
      p_id: Number(id), p_approve: b.approve, p_note: b.note?.trim() || null, p_actor: g.user.id,
    }));
    await writeAuditLog(g, { action: b.approve ? "approve_correction" : "reject_correction", entity: "trade",
      entityId: before.trade_id, before, after, reason: b.note });
    return Response.json(after);
  });
}
