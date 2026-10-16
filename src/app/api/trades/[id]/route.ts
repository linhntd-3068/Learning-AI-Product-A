import { ApiError, check, guard } from "@/lib/api/route-guard";

// One trade with its lot, parties, deliveries (cumulative / remaining), corrections and linked entries.
export async function GET(_request: Request, ctx: RouteContext<"/api/trades/[id]">) {
  const { id } = await ctx.params;
  return guard(["trades.read", "auction.record"], async ({ db }) => {
    const trade = check(await db.from("trades")
      .select("*, lot:lots(id, code, item, unit, available_qty), buyer:participants!trades_buyer_id_fkey(id, code, name), seller:participants!trades_seller_id_fkey(code, name), day:business_days(status)")
      .eq("id", id).maybeSingle());
    if (!trade) throw new ApiError(404, "Không tìm thấy giao dịch");
    const deliveries = check(await db.from("deliveries").select("*").eq("trade_id", id).order("seq"));
    const corrections = check(await db.from("corrections").select("*").eq("trade_id", id).order("id", { ascending: false }));
    const linked = check(await db.from("trades").select("id, code, business_day, entry_type, qty, unit_price, amount")
      .eq("reverses_id", id).order("id"));
    const delivered = deliveries.filter((d) => d.kind === "delivery").reduce((s, d) => s + Number(d.qty), 0);
    return Response.json({ trade, deliveries, corrections, linked, delivered, remaining: Math.max(Number(trade.qty) - delivered, 0) });
  });
}
