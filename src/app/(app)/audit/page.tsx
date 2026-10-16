"use client";
import { Fragment, useState } from "react";
import { RequirePermission } from "@/components/current-user-context";
import { Input, Notice, PageHeader, Select, Table, Td } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import { AUDIT_ACTION, fmtDateTime } from "@/lib/client/format-and-labels";

type Entry = { id: number; at: string; actor_email: string | null; action: string; entity: string; entity_id: string | null; before: unknown; after: unknown; reason: string | null };

const ENTITY: Record<string, string> = {
  trade: "Giao dịch", lot: "Lô", participant: "Người tham gia", business_day: "Ngày nghiệp vụ", user: "Tài khoản",
  role: "Vai trò", report: "Báo cáo", auth: "Đăng nhập",
};

// Audit log search (SCR-052): who did what, when, with the values before and after.
export default function AuditPage() {
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const { data, error } = useApi<Entry[]>(`/api/audit?entity=${entity}&entity_id=${encodeURIComponent(entityId)}`);

  return (
    <RequirePermission any={["audit.read"]}>
      <PageHeader title="Audit log" subtitle="300 thao tác gần nhất. Bấm vào dòng để xem giá trị trước / sau." />
      <div className="mb-3 flex flex-wrap gap-3">
        <Select value={entity} onChange={(e) => setEntity(e.target.value)} aria-label="Đối tượng">
          <option value="">Mọi đối tượng</option>
          {Object.entries(ENTITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input placeholder="Mã nội bộ (ID) của đối tượng" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
      </div>
      <Notice>{error}</Notice>
      <Table head={["Thời điểm", "Người làm", "Thao tác", "Đối tượng", "Lý do"]} empty={!!data && data.length === 0}>
        {(data ?? []).map((e) => (
          <Fragment key={e.id}>
            <tr onClick={() => setOpen(open === e.id ? null : e.id)} className="cursor-pointer hover:bg-slate-50">
              <Td className="whitespace-nowrap">{fmtDateTime(e.at)}</Td>
              <Td>{e.actor_email ?? "hệ thống"}</Td>
              <Td>{AUDIT_ACTION[e.action] ?? e.action}</Td>
              <Td>{ENTITY[e.entity] ?? e.entity} #{e.entity_id}</Td>
              <Td>{e.reason ?? ""}</Td>
            </tr>
            {open === e.id && (
              <tr className="bg-slate-50">
                <td colSpan={5} className="px-3 py-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <pre className="overflow-x-auto rounded bg-white p-2 text-xs"><b>Trước</b>{"\n"}{JSON.stringify(e.before, null, 2) ?? "—"}</pre>
                    <pre className="overflow-x-auto rounded bg-white p-2 text-xs"><b>Sau</b>{"\n"}{JSON.stringify(e.after, null, 2) ?? "—"}</pre>
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </Table>
    </RequirePermission>
  );
}
