import { guard } from "@/lib/api/route-guard";

// The signed-in user, role and permissions — the frontend builds its menu from this.
export async function GET() {
  return guard(null, async ({ user }) => Response.json(user));
}
