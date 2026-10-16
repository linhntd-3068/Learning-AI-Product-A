import { createSessionClient } from "@/lib/supabase/session-client";
import { createAdminClient } from "@/lib/supabase/admin-client";

// Sign in with email + password through Supabase Auth; the session is stored in httpOnly cookies.
export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) {
    return Response.json({ error: "Nhập email và mật khẩu" }, { status: 400 });
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: body.password });
  if (error || !data.user) {
    return Response.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return Response.json({ error: "Tài khoản chưa được cấp vai trò hoặc đã bị khóa" }, { status: 403 });
  }
  await createAdminClient().from("audit_logs").insert({
    actor: data.user.id, actor_email: email, action: "login", entity: "auth", entity_id: data.user.id,
  });
  return Response.json({ ok: true });
}
