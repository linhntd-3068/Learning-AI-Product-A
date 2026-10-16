import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

const SELECT = "*, trade:trades(id, code, business_day, qty, unit_price, amount, status, lot:lots(item, unit), buyer:participants!trades_buyer_id_fkey(name))";

// Correction requests, newest first (?status=pending to see the approval queue).
export async function GET(request: Request) {
  return guard(["corrections.request", "corrections.approve"], async ({ db }) => {
    const status = new URL(request.url).searchParams.get("status");
    let query = db.from("corrections").select(SELECT).order("id", { ascending: false });
    if (status) query = query.eq("status", status);
    const rows = check(await query);
    const people = check(await db.from("profiles").select("id, full_name"));
    const name = (id: string | null) => people.find((p) => p.id === id)?.full_name ?? null;
    return Response.json(rows.map((r) => ({ ...r, requested_by_name: name(r.requested_by), decided_by_name: name(r.decided_by) })));
  });
}

// Ask to change quantity / price of a confirmed trade. The original stays untouched until another user approves.
export async function POST(request: Request) {
  return guard("corrections.request", async (g) => {
    const b = await readJson<{ trade_id: number; new_qty: number; new_unit_price: number; reason: string }>(request);
    if (!b.reason?.trim()) throw new ApiError(400, "Phải nhập lý do điều chỉnh");
    if (!(Number(b.new_qty) > 0) || !(Number(b.new_unit_price) >= 0)) throw new ApiError(400, "Số lượng / đơn giá mới không hợp lệ");
    const trade = check(await g.db.from("trades").select("id, status, qty, unit_price").eq("id", b.trade_id).maybeSingle());
    if (!trade || trade.status !== "confirmed" || Number(trade.qty) <= 0) throw new ApiError(400, "Chỉ điều chỉnh được giao dịch đang ở trạng thái đã chốt");
    if (Number(trade.qty) === Number(b.new_qty) && Number(trade.unit_price) === Number(b.new_unit_price)) {
      throw new ApiError(400, "Giá trị mới giống giá trị hiện tại");
    }
    const pending = check(await g.db.from("corrections").select("id").eq("trade_id", b.trade_id).eq("status", "pending"));
    if (pending.length) throw new ApiError(400, "Giao dịch này đã có một yêu cầu đang chờ duyệt");
    const row = check(await g.db.from("corrections").insert({
      trade_id: b.trade_id, new_qty: Number(b.new_qty), new_unit_price: Number(b.new_unit_price),
      reason: b.reason.trim(), requested_by: g.user.id,
    }).select("*").single());
    await writeAuditLog(g, { action: "request_correction", entity: "trade", entityId: b.trade_id, before: trade, after: row, reason: b.reason });
    return Response.json(row, { status: 201 });
  });
}
