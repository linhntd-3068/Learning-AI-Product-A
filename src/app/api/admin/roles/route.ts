import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

// Permission matrix: roles × permissions, plus how many accounts hold each role.
export async function GET() {
  return guard("admin.roles", async ({ db }) => {
    const roles = check(await db.from("roles").select("code, name").order("sort"));
    const permissions = check(await db.from("permissions").select("code, name, grp").order("sort"));
    const grants = check(await db.from("role_permissions").select("role, permission"));
    const profiles = check(await db.from("profiles").select("role"));
    const users = Object.fromEntries(roles.map((r) => [r.code, profiles.filter((p) => p.role === r.code).length]));
    return Response.json({ roles, permissions, grants, users });
  });
}

// Grant or revoke one permission for one role. The system admin role always keeps the admin permissions,
// so nobody can lock the whole team out of account management.
export async function PUT(request: Request) {
  return guard("admin.roles", async (g) => {
    const b = await readJson<{ role: string; permission: string; enabled: boolean }>(request);
    if (!b.role || !b.permission || typeof b.enabled !== "boolean") throw new ApiError(400, "Thiếu vai trò, quyền hoặc trạng thái");
    if (b.role === "sys_admin" && b.permission.startsWith("admin.") && !b.enabled) {
      throw new ApiError(400, "Vai trò Quản trị hệ thống luôn giữ quyền quản trị");
    }
    if (b.enabled) {
      check(await g.db.from("role_permissions").upsert({ role: b.role, permission: b.permission }));
    } else {
      check(await g.db.from("role_permissions").delete().eq("role", b.role).eq("permission", b.permission));
    }
    await writeAuditLog(g, { action: b.enabled ? "grant" : "revoke", entity: "role", entityId: b.role,
      after: { permission: b.permission, enabled: b.enabled } });
    return Response.json({ ok: true });
  });
}
