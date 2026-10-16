import { ApiError, check, guard } from "@/lib/api/route-guard";
import { tradesWithDelivery } from "@/lib/api/delivery-status";

// Daily reconciliation (?day=): totals by trade kind, adjustment entries posted that day, and the trades
// that still need attention (not fully delivered or with an exception).
export async function GET(request: Request) {
  return guard("recon.read", async ({ db }) => {
    const day = new URL(request.url).searchParams.get("day");
    if (!day) throw new ApiError(400, "Chọn ngày nghiệp vụ");
    const info = check(await db.from("business_days").select("day, status, locked_at").eq("day", day).maybeSingle());
    if (!info) throw new ApiError(404, "Không có ngày nghiệp vụ này");

    const rows = await tradesWithDelivery(db, day);
    const counted = rows.filter((t) => t.status !== "cancelled");
    const sum = (list: typeof rows, f: (t: (typeof rows)[number]) => number) => list.reduce((s, t) => s + f(t), 0);
    const byKind = (kind: string) => {
      const list = counted.filter((t) => t.entry_type === "original" && t.kind === kind);
      return { count: list.length, qty: sum(list, (t) => t.qty), amount: sum(list, (t) => t.amount) };
    };
    const adjustments = counted.filter((t) => t.entry_type !== "original");
    const live = rows.filter((t) => t.status === "confirmed" && t.qty > 0);
    const issues = live.filter((t) => t.state !== "done");

    return Response.json({
      day: info,
      negotiated: byKind("negotiated"),
      auction: byKind("auction"),
      adjustments: { count: adjustments.length, amount: sum(adjustments, (t) => t.amount), rows: adjustments },
      // Ledger net of the day: every entry posted that day except cancelled ones. A reversed original keeps
      // its amount here; its reversal entry is posted (and netted) on the day the correction was approved.
      netAmount: sum(counted, (t) => t.amount),
      cancelled: rows.filter((t) => t.status === "cancelled").length,
      delivery: {
        done: live.filter((t) => t.state === "done").length,
        partial: live.filter((t) => t.state === "partial").length,
        waiting: live.filter((t) => t.state === "waiting").length,
        exception: live.filter((t) => t.state === "exception").length,
      },
      issues,
    });
  });
}
