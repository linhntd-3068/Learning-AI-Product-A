import "server-only";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin-client";

export type GuardContext = { user: CurrentUser; db: AdminClient };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

// Wrap a route handler: require a signed-in user (401) and, when given, one of the permissions (403).
// Database errors raised by the business functions come back as 400 with their Vietnamese message.
export async function guard(
  permission: string | string[] | null,
  handler: (ctx: GuardContext) => Promise<Response>,
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError(401, "Chưa đăng nhập hoặc phiên đã hết hạn");
    const needed = permission === null ? [] : Array.isArray(permission) ? permission : [permission];
    if (needed.length && !needed.some((p) => user.permissions.includes(p))) {
      return jsonError(403, "Vai trò của bạn không có quyền thực hiện thao tác này");
    }
    return await handler({ user, db: createAdminClient() });
  } catch (e) {
    if (e instanceof ApiError) return jsonError(e.status, e.message);
    console.error(e);
    return jsonError(500, e instanceof Error ? e.message : "Lỗi không xác định");
  }
}

// Throw when a Supabase call failed, keeping the database message for business-rule errors.
// Typed non-null: list queries always return an array on success. A maybeSingle() with no row still yields
// null at runtime, and every such caller checks `if (!row)` before use.
export function check<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new ApiError(400, result.error.message);
  return result.data as NonNullable<T>;
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Dữ liệu gửi lên không hợp lệ");
  }
}
