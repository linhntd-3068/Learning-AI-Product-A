import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

// Accounts with their role.
export async function GET() {
  return guard("admin.users", async ({ db }) => {
    const users = check(await db.from("profiles").select("id, email, full_name, role, active, created_at").order("created_at"));
    const roles = check(await db.from("roles").select("code, name").order("sort"));
    return Response.json({ users, roles });
  });
}

// Create a Supabase Auth account with a temporary password and give it a role.
export async function POST(request: Request) {
  return guard("admin.users", async (g) => {
    const b = await readJson<{ email: string; full_name: string; role: string; password: string }>(request);
    const email = b.email?.trim().toLowerCase();
    if (!email || !b.full_name?.trim() || !b.role) throw new ApiError(400, "Nhập email, họ tên và vai trò");
    if (!b.password || b.password.length < 8) throw new ApiError(400, "Mật khẩu tạm phải có ít nhất 8 ký tự");
    const role = check(await g.db.from("roles").select("code").eq("code", b.role).maybeSingle());
    if (!role) throw new ApiError(400, "Vai trò không tồn tại");

    const created = await g.db.auth.admin.createUser({ email, password: b.password, email_confirm: true });
    if (created.error || !created.data.user) throw new ApiError(400, created.error?.message ?? "Không tạo được tài khoản");
    const profile = check(await g.db.from("profiles").insert({
      id: created.data.user.id, email, full_name: b.full_name.trim(), role: b.role,
    }).select("*").single());
    await writeAuditLog(g, { action: "create_user", entity: "user", entityId: profile.id, after: profile });
    return Response.json(profile, { status: 201 });
  });
}
