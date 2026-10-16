import { check, guard } from "@/lib/api/route-guard";

const EXPIRY_WARNING_DAYS = 30;

// Home screen: today's figures and the alerts that need someone's attention.
export async function GET() {
  return guard(null, async ({ db }) => {
    const today = new Date().toISOString().slice(0, 10);
    const limit = new Date(Date.now() + EXPIRY_WARNING_DAYS * 86400000).toISOString().slice(0, 10);

    const days = check(await db.from("business_days").select("day, status").order("day", { ascending: false }).limit(1));
    const current = days[0] ?? null;
    const trades = current
      ? check(await db.from("trades").select("id, qty, amount, kind, status, entry_type").eq("business_day", current.day))
      : [];
    const live = trades.filter((t) => t.status === "confirmed" && t.entry_type === "original");

    const expiring = check(await db.from("participants")
      .select("id, code, name, kind, basis, status, valid_to")
      .neq("status", "expired").lte("valid_to", limit).order("valid_to"));
    const pending = check(await db.from("corrections").select("id", { count: "exact", head: false }).eq("status", "pending"));

    const confirmed = check(await db.from("trades").select("id, qty").eq("status", "confirmed").gt("qty", 0));
    const delivered = check(await db.from("deliveries").select("trade_id, qty").eq("kind", "delivery"));
    const doneByTrade = new Map<number, number>();
    delivered.forEach((d) => doneByTrade.set(d.trade_id, (doneByTrade.get(d.trade_id) ?? 0) + Number(d.qty)));
    const openDeliveries = confirmed.filter((t) => (doneByTrade.get(t.id) ?? 0) < Number(t.qty)).length;

    return Response.json({
      today,
      currentDay: current,
      tradeCount: live.length,
      negotiatedCount: live.filter((t) => t.kind === "negotiated").length,
      auctionCount: live.filter((t) => t.kind === "auction").length,
      tradeAmount: live.reduce((s, t) => s + Number(t.amount), 0),
      expiring: expiring.map((p) => ({ ...p, expired: p.valid_to < today })),
      pendingCorrections: pending.length,
      openDeliveries,
    });
  });
}
