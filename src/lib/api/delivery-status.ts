import "server-only";
import type { AdminClient } from "@/lib/supabase/admin-client";
import { check } from "./route-guard";

export type TradeDeliveryRow = {
  id: number; code: string; business_day: string; kind: string; entry_type: string; status: string;
  qty: number; unit_price: number; amount: number;
  lot: { code: string; item: string; unit: string } | null;
  buyer: { code: string; name: string } | null;
  delivered: number; remaining: number; exceptions: number;
  state: "waiting" | "partial" | "done" | "exception";
};

// Live trades (confirmed, positive quantity) with delivered / remaining quantity and a delivery state.
// Used by the delivery list and the daily reconciliation.
export async function tradesWithDelivery(db: AdminClient, day?: string): Promise<TradeDeliveryRow[]> {
  let query = db.from("trades")
    .select("id, code, business_day, kind, entry_type, status, qty, unit_price, amount, lot:lots(code, item, unit), buyer:participants!trades_buyer_id_fkey(code, name)")
    .order("id");
  if (day) query = query.eq("business_day", day);
  const trades = check(await query) as unknown as Omit<TradeDeliveryRow, "delivered" | "remaining" | "exceptions" | "state">[];
  const ids = trades.map((t) => t.id);
  const deliveries = ids.length
    ? check(await db.from("deliveries").select("trade_id, qty, kind").in("trade_id", ids))
    : [];
  return trades.map((t) => {
    const mine = deliveries.filter((d) => d.trade_id === t.id);
    const delivered = mine.filter((d) => d.kind === "delivery").reduce((s, d) => s + Number(d.qty), 0);
    const exceptions = mine.filter((d) => d.kind === "exception").length;
    const remaining = Math.max(Number(t.qty) - delivered, 0);
    const state = exceptions ? "exception" : delivered === 0 ? "waiting" : remaining > 0 ? "partial" : "done";
    return { ...t, qty: Number(t.qty), unit_price: Number(t.unit_price), amount: Number(t.amount), delivered, remaining, exceptions, state };
  });
}
