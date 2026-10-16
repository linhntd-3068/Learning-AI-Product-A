import { check, guard } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

// Close the books for a business day; after this the day's trades can only change through corrections.
export async function POST(_request: Request, ctx: RouteContext<"/api/business-days/[day]/lock">) {
  const { day } = await ctx.params;
  return guard("recon.lock", async (g) => {
    const row = check(await g.db.rpc("fn_lock_day", { p_day: day, p_actor: g.user.id }));
    await writeAuditLog(g, { action: "lock_day", entity: "business_day", entityId: day, before: { status: "open" }, after: row });
    return Response.json(row);
  });
}
