import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

const EXCEPTIONS = ["short", "over", "return", "partial_cancel"];

// Record one delivery run, or an exception (short / over / return / partial cancel) with a reason.
// The buyer's validity is checked again at delivery time.
export async function POST(request: Request, ctx: RouteContext<"/api/trades/[id]/deliveries">) {
  const { id } = await ctx.params;
  return guard("deliveries.record", async (g) => {
    const b = await readJson<{ kind: string; qty: number; exception_type?: string; note?: string }>(request);
    if (b.kind !== "delivery" && b.kind !== "exception") throw new ApiError(400, "Loại ghi nhận không hợp lệ");
    if (!(Number(b.qty) > 0)) throw new ApiError(400, "Số lượng phải lớn hơn 0");
    if (b.kind === "exception" && !EXCEPTIONS.includes(b.exception_type ?? "")) throw new ApiError(400, "Chọn loại ngoại lệ");
    if (b.kind === "exception" && !b.note?.trim()) throw new ApiError(400, "Ngoại lệ phải có lý do");
    const row = check(await g.db.rpc("fn_record_delivery", {
      p_trade: Number(id), p_qty: Number(b.qty), p_kind: b.kind, p_exception: b.exception_type ?? null,
      p_note: b.note?.trim() || null, p_actor: g.user.id,
    }));
    await writeAuditLog(g, { action: b.kind === "exception" ? "delivery_exception" : "deliver", entity: "trade", entityId: id, after: row, reason: b.note });
    return Response.json(row, { status: 201 });
  });
}
