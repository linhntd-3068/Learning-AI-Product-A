import "server-only";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createSessionClient } from "@/lib/supabase/session-client";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleName: string;
  permissions: string[];
};

// The signed-in user with role and permissions, or null when there is no valid session,
// no profile, or the account is deactivated.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await createSessionClient();
  const { data, error } = await session.auth.getUser();
  if (error || !data.user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, role, active, roles(name)")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || !profile.active) return null;

  const { data: perms } = await admin.from("role_permissions").select("permission").eq("role", profile.role);
  const role = profile.roles as unknown as { name: string } | null;
  return {
    id: data.user.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    roleName: role?.name ?? profile.role,
    permissions: (perms ?? []).map((p) => p.permission as string),
  };
}
