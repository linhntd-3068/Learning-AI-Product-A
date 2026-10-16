"use client";
import Link from "next/link";
import { useState } from "react";
import { RequirePermission, useCan, useMe } from "@/components/current-user-context";
import { Button, Input, Notice, PageHeader, Select, StatusBadge, Table, Td } from "@/components/ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";
import { CORRECTION_STATUS, fmtDate, fmtDateTime, fmtNum, fmtYen } from "@/lib/client/format-and-labels";

type Correction = {
  id: number; trade_id: number; new_qty: number; new_unit_price: number; reason: string; status: string;
  requested_by: string; requested_by_name: string | null; requested_at: string;
  decided_by_name: string | null; decided_at: string | null; decision_note: string | null;
  trade: { id: number; code: string; business_day: string; qty: number; unit_price: number; amount: number; lot: { item: string; unit: string } | null; buyer: { name: string } | null } | null;
};

// Correction requests (SCR-022) and approval (SCR-023). The requester cannot approve their own request;
// approval posts a reversal and a corrected entry instead of overwriting the original.
export default function CorrectionsPage() {
  const me = useMe();
  const can = useCan();
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const { data, error, reload } = useApi<Correction[]>(`/api/corrections${status ? `?status=${status}` : ""}`);

  async function decide(c: Correction, approve: boolean) {
    try {
      await apiSend("POST", `/api/corrections/${c.id}/decision`, { approve, note: notes[c.id] ?? "" });
      setMsg({ kind: "success", text: approve ? `Đã duyệt: sinh bút toán đảo và bút toán điều chỉnh cho ${c.trade?.code}` : `Đã từ chối yêu cầu cho ${c.trade?.code}` });
      reload();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    }
  }

  return (
    <RequirePermission any={["corrections.request", "corrections.approve"]}>
      <PageHeader title="Điều chỉnh sau khi chốt"
        subtitle="Tạo yêu cầu từ trang chi tiết giao dịch. Người duyệt phải khác người tạo; duyệt không ghi đè số cũ."
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Trạng thái">
            <option value="">Tất cả</option>
            {Object.entries(CORRECTION_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        } />
      <Notice>{error}</Notice>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Table head={["Giao dịch", "Hiện tại", "Đề nghị", "Lý do", "Người tạo", "Trạng thái", "Duyệt"]} empty={!!data && data.length === 0}>
        {(data ?? []).map((c) => (
          <tr key={c.id} className="align-top">
            <Td>
              {c.trade && <Link href={`/trades/${c.trade.id}`} className="font-medium text-sky-700 hover:underline">{c.trade.code}</Link>}
              <div className="text-xs text-slate-500">{c.trade?.lot?.item} · {c.trade?.buyer?.name} · {fmtDate(c.trade?.business_day)}</div>
            </Td>
            <Td className="tabular-nums">{fmtNum(c.trade?.qty)} × {fmtYen(c.trade?.unit_price)}<div className="text-xs text-slate-500">{fmtYen(c.trade?.amount)}</div></Td>
            <Td className="tabular-nums font-medium">{fmtNum(c.new_qty)} × {fmtYen(c.new_unit_price)}<div className="text-xs text-slate-500">{fmtYen(Number(c.new_qty) * Number(c.new_unit_price))}</div></Td>
            <Td className="max-w-xs">{c.reason}</Td>
            <Td>{c.requested_by_name}<div className="text-xs text-slate-500">{fmtDateTime(c.requested_at)}</div></Td>
            <Td>
              <StatusBadge code={c.status} label={CORRECTION_STATUS[c.status]} />
              {c.decided_by_name && <div className="mt-1 text-xs text-slate-500">{c.decided_by_name}{c.decision_note ? `: ${c.decision_note}` : ""}</div>}
            </Td>
            <Td>
              {c.status === "pending" && can("corrections.approve") && (c.requested_by === me.id
                ? <span className="text-xs text-slate-500">Bạn là người tạo — không được tự duyệt</span>
                : (
                  <div className="flex min-w-48 flex-col gap-1.5">
                    <Input placeholder="Ý kiến (bắt buộc khi từ chối)" value={notes[c.id] ?? ""} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} />
                    <div className="flex gap-1.5">
                      <Button onClick={() => decide(c, true)}>Duyệt</Button>
                      <Button variant="secondary" onClick={() => decide(c, false)}>Từ chối</Button>
                    </div>
                  </div>
                ))}
            </Td>
          </tr>
        ))}
      </Table>
    </RequirePermission>
  );
}
