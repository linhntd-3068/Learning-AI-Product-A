import { check, guard } from "@/lib/api/route-guard";

// Participants list; ?kind= filters by type, ?q= searches code / name.
export async function GET(request: Request) {
  return guard(["participants.read", "trades.create", "auction.record", "lots.create"], async ({ db }) => {
    const params = new URL(request.url).searchParams;
    let query = db.from("participants").select("*").order("code");
    const kind = params.get("kind");
    const q = params.get("q");
    if (kind) query = query.eq("kind", kind);
    if (q) query = query.or(`code.ilike.%${q.replace(/[%,()]/g, "")}%,name.ilike.%${q.replace(/[%,()]/g, "")}%`);
    return Response.json(check(await query));
  });
}
