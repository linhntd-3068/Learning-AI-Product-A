import { guard } from "@/lib/api/route-guard";
import { tradesWithDelivery } from "@/lib/api/delivery-status";

// Delivery work list: live trades of a day (?day=) with delivered / remaining quantity.
export async function GET(request: Request) {
  return guard("trades.read", async ({ db }) => {
    const day = new URL(request.url).searchParams.get("day") ?? undefined;
    const rows = await tradesWithDelivery(db, day);
    return Response.json(rows.filter((t) => t.status === "confirmed" && t.qty > 0));
  });
}
