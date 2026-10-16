import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

// Lots of one business day (?day=YYYY-MM-DD); ?available=1 keeps only lots that still have stock.
export async function GET(request: Request) {
  return guard(["lots.read", "trades.create", "auction.record"], async ({ db }) => {
    const params = new URL(request.url).searchParams;
    let query = db.from("lots").select("*, seller:participants!lots_seller_id_fkey(code, name)").order("code");
    const day = params.get("day");
    if (day) query = query.eq("business_day", day);
    if (params.get("available") === "1") query = query.gt("available_qty", 0);
    return Response.json(check(await query));
  });
}

// Lot intake: the database assigns the lot code and checks the day is open and the seller is a valid wholesaler.
export async function POST(request: Request) {
  return guard("lots.create", async (g) => {
    const b = await readJson<{ day: string; seller_id: number; shipper: string; item: string; unit: string; qty: number }>(request);
    if (!b.day || !b.seller_id || !b.shipper?.trim() || !b.item?.trim() || !b.unit?.trim()) {
      throw new ApiError(400, "Nhập đủ ngày, bên bán, chủ hàng, mặt hàng, đơn vị");
    }
    if (!(Number(b.qty) > 0)) throw new ApiError(400, "Số lượng phải lớn hơn 0");
    const lot = check(await g.db.rpc("fn_create_lot", {
      p_day: b.day, p_seller: b.seller_id, p_shipper: b.shipper.trim(), p_item: b.item.trim(),
      p_unit: b.unit.trim(), p_qty: Number(b.qty), p_actor: g.user.id,
    }));
    await writeAuditLog(g, { action: "create", entity: "lot", entityId: lot.id, after: lot });
    return Response.json(lot, { status: 201 });
  });
}
