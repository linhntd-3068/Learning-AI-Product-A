import { createSessionClient } from "@/lib/supabase/session-client";

export async function POST() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
