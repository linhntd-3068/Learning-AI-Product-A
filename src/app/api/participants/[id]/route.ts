import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

const STATUSES = ["active", "suspended", "expired", "under_review"];

export async function GET(_request: Request, ctx: RouteContext<"/api/participants/[id]">) {
  const { id } = await ctx.params;
  return guard("participants.read", async ({ db }) => {
    const participant = check(await db.from("participants").select("*").eq("id", id).maybeSingle());
    if (!participant) throw new ApiError(404, "Không tìm thấy người tham gia");
    const trades = check(await db.from("trades")
      .select("id, code, business_day, kind, qty, unit_price, amount, status, entry_type, lots(item, unit)")
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`).order("confirmed_at", { ascending: false }).limit(20));
    return Response.json({ participant, trades });
  });
}

// Change status / validity period / contact. Every change is audited with before and after.
export async function PATCH(request: Request, ctx: RouteContext<"/api/participants/[id]">) {
  const { id } = await ctx.params;
  return guard("participants.write", async (g) => {
    const body = await readJson<{ status?: string; valid_from?: string; valid_to?: string; phone?: string; note?: string; reason?: string }>(request);
    if (body.status && !STATUSES.includes(body.status)) throw new ApiError(400, "Trạng thái không hợp lệ");
    if (!body.reason?.trim()) throw new ApiError(400, "Phải nhập lý do thay đổi");
    const before = check(await g.db.from("participants").select("*").eq("id", id).single());
    const patch = {
      status: body.status ?? before.status,
      valid_from: body.valid_from ?? before.valid_from,
      valid_to: body.valid_to ?? before.valid_to,
      phone: body.phone ?? before.phone,
      note: body.note ?? before.note,
      updated_at: new Date().toISOString(),
    };
    if (patch.valid_to < patch.valid_from) throw new ApiError(400, "Ngày hết hạn phải sau ngày bắt đầu");
    const after = check(await g.db.from("participants").update(patch).eq("id", id).select("*").single());
    await writeAuditLog(g, { action: "update", entity: "participant", entityId: id, before, after, reason: body.reason });
    return Response.json(after);
  });
}
