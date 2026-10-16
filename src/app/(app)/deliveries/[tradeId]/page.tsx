"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RequirePermission } from "@/components/current-user-context";
import { Button, Card, Field, Input, Notice, PageHeader, Select, StatusBadge, Table, Td } from "@/components/ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";
import type { Trade } from "@/lib/client/domain-types";
import { EXCEPTION_TYPE, fmtDateTime, fmtNum } from "@/lib/client/format-and-labels";

type Detail = {
  trade: Trade;
  deliveries: { id: number; seq: number; qty: number; kind: string; exception_type: string | null; note: string | null; recorded_at: string }[];
  delivered: number; remaining: number;
};

// Record deliveries for one trade (SCR-029) and exceptions with a reason (SCR-030). Big touch targets for tablets.
export default function RecordDeliveryPage() {
  const { tradeId } = useParams<{ tradeId: string }>();
  const { data, error, reload } = useApi<Detail>(`/api/trades/${tradeId}`);
  const [f, setF] = useState({ kind: "delivery", qty: "", exception_type: "short", note: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await apiSend("POST", `/api/trades/${tradeId}/deliveries`, { ...f, qty: Number(f.qty) });
      setMsg({ kind: "success", text: f.kind === "delivery" ? `Đã ghi giao ${f.qty}` : `Đã ghi ngoại lệ: ${EXCEPTION_TYPE[f.exception_type]}` });
      setF({ ...f, qty: "", note: "" });
      reload();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    }
  }

  const t = data?.trade;
  return (
    <RequirePermission any={["deliveries.record"]}>
      <PageHeader title={t ? `Giao hàng · ${t.code}` : "Giao hàng"}
        subtitle={t ? `${t.lot?.item} · người mua ${t.buyer?.name}` : undefined}
        actions={<Link href="/deliveries" className="text-sm text-sky-700 hover:underline">← Danh sách giao hàng</Link>} />
      <Notice>{error}</Notice>
      {t && data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Tình trạng">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Đã bán", t.qty], ["Đã giao", data.delivered], ["Còn lại", data.remaining]].map(([label, v]) => (
                <div key={label as string} className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-2xl font-bold tabular-nums">{fmtNum(v as number)}</div>
                  <div className="text-xs text-slate-500">{t.lot?.unit}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Ghi nhận">
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <Field label="Loại">
                <Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="py-2.5">
                  <option value="delivery">Giao một chuyến</option>
                  <option value="exception">Ngoại lệ</option>
                </Select>
              </Field>
              {f.kind === "exception" && (
                <Field label="Loại ngoại lệ">
                  <Select value={f.exception_type} onChange={(e) => setF({ ...f, exception_type: e.target.value })} className="py-2.5">
                    {Object.entries(EXCEPTION_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
              )}
              <Field label={`Số lượng (${t.lot?.unit ?? ""})`}>
                <Input required type="number" min="0.01" step="0.01" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} className="py-2.5 text-lg" />
              </Field>
              <Field label={f.kind === "exception" ? "Lý do (bắt buộc)" : "Ghi chú"}>
                <Input required={f.kind === "exception"} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className="py-2.5" />
              </Field>
              <div className="sm:col-span-2"><Button type="submit" className="w-full py-3 text-base">Lưu</Button></div>
            </form>
          </Card>
          <div className="lg:col-span-2">
            <Table head={["Lần", "Loại", "Số lượng", "Ghi chú", "Lúc ghi"]} empty={data.deliveries.length === 0}>
              {data.deliveries.map((d) => (
                <tr key={d.id}>
                  <Td>{d.seq}</Td>
                  <Td>{d.kind === "exception" ? <StatusBadge code="exception" label={EXCEPTION_TYPE[d.exception_type ?? ""]} /> : "Giao"}</Td>
                  <Td className="tabular-nums">{fmtNum(d.qty)}</Td>
                  <Td>{d.note ?? ""}</Td>
                  <Td className="text-slate-500">{fmtDateTime(d.recorded_at)}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      )}
    </RequirePermission>
  );
}
