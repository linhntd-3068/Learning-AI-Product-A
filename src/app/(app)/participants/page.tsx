"use client";
import Link from "next/link";
import { useState } from "react";
import { RequirePermission } from "@/components/current-user-context";
import { Input, Notice, PageHeader, Select, StatusBadge, Table, Td } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import { BASIS, PARTICIPANT_KIND, PARTICIPANT_STATUS, fmtDate } from "@/lib/client/format-and-labels";
import type { Participant } from "@/lib/client/domain-types";

// Participants list (SCR-009) with the "expiring soon" view (SCR-011).
export default function ParticipantsPage() {
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const { data, error } = useApi<Participant[]>(`/api/participants?kind=${kind}&q=${encodeURIComponent(q)}`);
  // Reference dates fixed once per visit (render must stay pure).
  const [{ today, soon }] = useState(() => ({
    today: new Date().toISOString().slice(0, 10),
    soon: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  }));
  const rows = (data ?? []).filter((p) => !expiringOnly || p.valid_to <= soon);

  return (
    <RequirePermission any={["participants.read"]}>
      <PageHeader title="Người tham gia" subtitle="4 loại, mỗi loại một căn cứ tham gia riêng: đăng ký, giấy phép, chấp thuận" />
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Input placeholder="Tìm mã hoặc tên" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Loại">
          <option value="">Tất cả loại</option>
          {Object.entries(PARTICIPANT_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={expiringOnly} onChange={(e) => setExpiringOnly(e.target.checked)} />
          Chỉ hiện hết hạn trong 30 ngày
        </label>
      </div>
      <Notice>{error}</Notice>
      <Table head={["Mã", "Tên", "Loại", "Căn cứ", "Trạng thái", "Hiệu lực", "Ghi chú"]} empty={!!data && rows.length === 0}>
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-slate-50">
            <Td><Link href={`/participants/${p.id}`} className="font-medium text-sky-700 hover:underline">{p.code}</Link></Td>
            <Td>{p.name}</Td>
            <Td>{PARTICIPANT_KIND[p.kind]}</Td>
            <Td>{BASIS[p.basis]}</Td>
            <Td><StatusBadge code={p.status} label={PARTICIPANT_STATUS[p.status]} /></Td>
            <Td className={p.valid_to < today ? "text-rose-700" : p.valid_to <= soon ? "text-amber-700" : ""}>
              {fmtDate(p.valid_from)} – {fmtDate(p.valid_to)}
            </Td>
            <Td className="text-slate-500">{p.note ?? ""}</Td>
          </tr>
        ))}
      </Table>
    </RequirePermission>
  );
}
