import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

const SELECT = "*, lot:lots(code, item, unit), buyer:participants!trades_buyer_id_fkey(code, name), seller:participants!trades_seller_id_fkey(code, name)";

// Trades of a business day (?day=), optionally one kind (?kind=negotiated|auction).
export async function GET(request: Request) {
  return guard(["trades.read", "auction.record"], async ({ db }) => {
    const params = new URL(request.url).searchParams;
    let query = db.from("trades").select(SELECT).order("id", { ascending: false });
    const day = params.get("day");
    const kind = params.get("kind");
    if (day) query = query.eq("business_day", day);
    if (kind) query = query.eq("kind", kind);
    return Response.json(check(await query));
  });
}

// Confirm a negotiated trade or record a final auction result. The database function checks the buyer's
// validity on the business day, the lot's available quantity and that the day is still open.
export async function POST(request: Request) {
  const raw = request.clone();
  const kind = ((await raw.json().catch(() => ({}))) as { kind?: string }).kind;
  const permission = kind === "auction" ? "auction.record" : "trades.create";
  return guard(permission, async (g) => {
    const b = await readJson<{ kind: string; lot_id: number; buyer_id: number; qty: number; unit_price: number; note?: string }>(request);
    if (b.kind !== "negotiated" && b.kind !== "auction") throw new ApiError(400, "Loại giao dịch không hợp lệ");
    if (!b.lot_id || !b.buyer_id) throw new ApiError(400, "Chọn lô và người mua");
    const trade = check(await g.db.rpc("fn_confirm_trade", {
      p_lot: b.lot_id, p_buyer: b.buyer_id, p_kind: b.kind, p_qty: Number(b.qty),
      p_price: Number(b.unit_price), p_actor: g.user.id, p_note: b.note?.trim() || null,
    }));
    await writeAuditLog(g, { action: b.kind === "auction" ? "record_auction" : "confirm", entity: "trade", entityId: trade.id, after: trade });
    return Response.json(trade, { status: 201 });
  });
}
