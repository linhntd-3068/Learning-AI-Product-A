"use client";
import { useState, type FormEvent } from "react";
import { RequirePermission, useMe } from "@/components/current-user-context";
import { Button, Card, Field, Input, Notice, PageHeader, Select, StatusBadge, Table, Td } from "@/components/ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";
import { fmtDate } from "@/lib/client/format-and-labels";

type Data = {
  users: { id: string; email: string; full_name: string; role: string; active: boolean; created_at: string }[];
  roles: { code: string; name: string }[];
};

// Accounts (SCR-004 / 005): create an account, change its role, lock / unlock it.
export default function UsersPage() {
  const me = useMe();
  const { data, error, reload } = useApi<Data>("/api/admin/users");
  const [f, setF] = useState({ email: "", full_name: "", role: "", password: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      setMsg({ kind: "success", text: ok });
      reload();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    }
  }
  const create = (e: FormEvent) => {
    e.preventDefault();
    run(async () => { await apiSend("POST", "/api/admin/users", f); setF({ email: "", full_name: "", role: "", password: "" }); }, `Đã tạo tài khoản ${f.email}`);
  };
  const roleName = (code: string) => data?.roles.find((r) => r.code === code)?.name ?? code;

  return (
    <RequirePermission any={["admin.users"]}>
      <PageHeader title="Tài khoản" subtitle="Mỗi người một tài khoản, một vai trò. Mọi thay đổi được ghi audit log." />
      <Notice>{error}</Notice>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Card title="Tạo tài khoản" className="mb-4">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Email"><Input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Họ tên"><Input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Vai trò">
            <Select required value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="">— Chọn —</option>
              {(data?.roles ?? []).map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Mật khẩu tạm (≥ 8 ký tự)"><Input required type="password" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <div className="flex items-end"><Button type="submit">Tạo</Button></div>
        </form>
      </Card>
      <Table head={["Họ tên", "Email", "Vai trò", "Trạng thái", "Ngày tạo", ""]} empty={!!data && data.users.length === 0}>
        {(data?.users ?? []).map((u) => (
          <tr key={u.id}>
            <Td className="font-medium">{u.full_name}{u.id === me.id && <span className="text-xs text-slate-500"> (bạn)</span>}</Td>
            <Td>{u.email}</Td>
            <Td>
              <Select value={u.role} disabled={u.id === me.id} aria-label={`Vai trò của ${u.full_name}`}
                onChange={(e) => run(() => apiSend("PATCH", `/api/admin/users/${u.id}`, { role: e.target.value }), `Đã đổi vai trò của ${u.full_name} thành ${roleName(e.target.value)}`)}>
                {(data?.roles ?? []).map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </Select>
            </Td>
            <Td><StatusBadge code={u.active ? "active" : "suspended"} label={u.active ? "Đang dùng" : "Đã khóa"} /></Td>
            <Td>{fmtDate(u.created_at)}</Td>
            <Td>
              {u.id !== me.id && (
                <Button variant="secondary" onClick={() => run(() => apiSend("PATCH", `/api/admin/users/${u.id}`, { active: !u.active }), u.active ? `Đã khóa ${u.full_name}` : `Đã mở khóa ${u.full_name}`)}>
                  {u.active ? "Khóa" : "Mở khóa"}
                </Button>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    </RequirePermission>
  );
}
