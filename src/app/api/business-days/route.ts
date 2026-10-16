import { check, guard } from "@/lib/api/route-guard";

// All business days, newest first (used by the day pickers).
export async function GET() {
  return guard(null, async ({ db }) => {
    const days = check(await db.from("business_days").select("day, status, locked_at").order("day", { ascending: false }));
    return Response.json(days);
  });
}
