import { check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

// Cancel a trade before its day is locked and before any delivery; the lot quantity is given back.
export async function POST(request: Request, ctx: RouteContext<"/api/trades/[id]/cancel">) {
  const { id } = await ctx.params;
  return guard("trades.cancel", async (g) => {
    const { reason } = await readJson<{ reason?: string }>(request);
    const before = check(await g.db.from("trades").select("*").eq("id", id).single());
    const after = check(await g.db.rpc("fn_cancel_trade", { p_trade: Number(id), p_actor: g.user.id, p_reason: reason ?? "" }));
    await writeAuditLog(g, { action: "cancel", entity: "trade", entityId: id, before, after, reason });
    return Response.json(after);
  });
}
