import { check, guard } from "@/lib/api/route-guard";

// Latest 300 audit entries; ?entity= and ?entity_id= narrow it down (e.g. one trade's history).
export async function GET(request: Request) {
  return guard("audit.read", async ({ db }) => {
    const params = new URL(request.url).searchParams;
    let query = db.from("audit_logs").select("*").order("at", { ascending: false }).limit(300);
    const entity = params.get("entity");
    const entityId = params.get("entity_id");
    const action = params.get("action");
    if (entity) query = query.eq("entity", entity);
    if (entityId) query = query.eq("entity_id", entityId);
    if (action) query = query.eq("action", action);
    return Response.json(check(await query));
  });
}
