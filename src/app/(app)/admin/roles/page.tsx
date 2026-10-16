"use client";
import { Fragment, useState } from "react";
import { RequirePermission } from "@/components/current-user-context";
import { Notice, PageHeader } from "@/components/ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";

type Matrix = {
  roles: { code: string; name: string }[];
  permissions: { code: string; name: string; grp: string }[];
  grants: { role: string; permission: string }[];
  users: Record<string, number>;
};

// Role & permission matrix (SCR-006): tick a box to grant, untick to revoke. Saved immediately and audited.
export default function RolesPage() {
  const { data, error, reload } = useApi<Matrix>("/api/admin/roles");
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const has = (role: string, perm: string) => !!data?.grants.some((g) => g.role === role && g.permission === perm);

  async function toggle(role: string, perm: string, enabled: boolean) {
    setBusy(`${role}:${perm}`);
    try {
      await apiSend("PUT", "/api/admin/roles", { role, permission: perm, enabled });
      setMsg({ kind: "success", text: `${enabled ? "Đã cấp" : "Đã thu hồi"} quyền "${data?.permissions.find((p) => p.code === perm)?.name}" cho ${data?.roles.find((r) => r.code === role)?.name}. Có hiệu lực ở lần tải trang kế tiếp của người dùng.` });
      reload();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy("");
    }
  }

  const groups = [...new Set((data?.permissions ?? []).map((p) => p.grp))];
  return (
    <RequirePermission any={["admin.roles"]}>
      <PageHeader title="Vai trò & phân quyền" subtitle="Tách người soạn và người duyệt: Đối soát tạo yêu cầu điều chỉnh, Phê duyệt mới được duyệt." />
      <Notice>{error}</Notice>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {data && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="sticky left-0 bg-slate-50 px-3 py-2 text-left">Quyền</th>
                {data.roles.map((r) => (
                  <th key={r.code} className="px-2 py-2 text-center font-semibold">
                    {r.name}<div className="font-normal text-slate-400">{data.users[r.code] ?? 0} người</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g}>
                  <tr className="bg-slate-100"><td colSpan={data.roles.length + 1} className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{g}</td></tr>
                  {data.permissions.filter((p) => p.grp === g).map((p) => (
                    <tr key={p.code} className="border-t border-slate-100">
                      <td className="sticky left-0 bg-white px-3 py-1.5">{p.name}<div className="font-mono text-[11px] text-slate-400">{p.code}</div></td>
                      {data.roles.map((r) => (
                        <td key={r.code} className="px-2 py-1.5 text-center">
                          <input type="checkbox" aria-label={`${r.name} – ${p.name}`} className="h-4 w-4 accent-sky-700"
                            checked={has(r.code, p.code)} disabled={busy !== ""}
                            onChange={(e) => toggle(r.code, p.code, e.target.checked)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </RequirePermission>
  );
}
