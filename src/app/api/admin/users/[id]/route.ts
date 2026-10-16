import { ApiError, check, guard, readJson } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

// Change an account's role, name or active flag. Admins cannot lock themselves out.
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const { id } = await ctx.params;
  return guard("admin.users", async (g) => {
    const b = await readJson<{ role?: string; full_name?: string; active?: boolean; reason?: string }>(request);
    if (id === g.user.id && (b.active === false || (b.role && b.role !== g.user.role))) {
      throw new ApiError(400, "Không thể tự khóa hoặc tự đổi vai trò của chính mình");
    }
    const before = check(await g.db.from("profiles").select("*").eq("id", id).maybeSingle());
    if (!before) throw new ApiError(404, "Không tìm thấy tài khoản");
    const after = check(await g.db.from("profiles").update({
      role: b.role ?? before.role,
      full_name: b.full_name?.trim() || before.full_name,
      active: b.active ?? before.active,
    }).eq("id", id).select("*").single());
    await writeAuditLog(g, { action: "update_user", entity: "user", entityId: id, before, after, reason: b.reason });
    return Response.json(after);
  });
}
