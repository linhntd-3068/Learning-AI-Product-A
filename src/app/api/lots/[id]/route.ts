import { ApiError, check, guard } from "@/lib/api/route-guard";

// One lot with its seller and every trade made on it.
export async function GET(_request: Request, ctx: RouteContext<"/api/lots/[id]">) {
  const { id } = await ctx.params;
  return guard("lots.read", async ({ db }) => {
    const lot = check(await db.from("lots")
      .select("*, seller:participants!lots_seller_id_fkey(code, name), day:business_days(status)")
      .eq("id", id).maybeSingle());
    if (!lot) throw new ApiError(404, "Không tìm thấy lô");
    const trades = check(await db.from("trades")
      .select("id, code, business_day, kind, entry_type, qty, unit_price, amount, status, buyer:participants!trades_buyer_id_fkey(code, name)")
      .eq("lot_id", id).order("id"));
    return Response.json({ lot, trades });
  });
}
