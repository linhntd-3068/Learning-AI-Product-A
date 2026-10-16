"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RequirePermission, useCan } from "@/components/current-user-context";
import { Button, Card, Field, Input, Notice, PageHeader, Select, StatusBadge, Table, Td } from "@/components/ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";
import type { Lot, Trade } from "@/lib/client/domain-types";
import { ENTRY_TYPE, LOT_STATUS, TRADE_KIND, TRADE_STATUS, fmtDate, fmtDateTime, fmtNum, fmtYen } from "@/lib/client/format-and-labels";

type Detail = { lot: Lot & { day: { status: string } | null }; trades: Trade[] };

// Lot detail (SCR-015) with the human inspection result (SCR-013).
export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const { data, error, reload } = useApi<Detail>(`/api/lots/${id}`);
  const [grade, setGrade] = useState("A");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function inspect(e: FormEvent) {
    e.preventDefault();
    try {
      await apiSend("POST", `/api/lots/${id}/inspection`, { grade, note, reason });
      setMsg({ kind: "success", text: "Đã ghi kết quả đánh giá" });
      setReason("");
      reload();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    }
  }

  const lot = data?.lot;
  return (
    <RequirePermission any={["lots.read"]}>
      <PageHeader title={lot ? `Lô ${lot.code} · ${lot.item}` : "Lô hàng"}
        subtitle={lot ? `Ngày nghiệp vụ ${fmtDate(lot.business_day)} · bên bán ${lot.seller?.name} · chủ hàng ${lot.shipper}` : undefined}
        actions={<Link href="/lots" className="text-sm text-sky-700 hover:underline">← Danh sách lô</Link>} />
      <Notice>{error}</Notice>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {lot && data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Số lượng">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Ban đầu</dt><dd className="tabular-nums">{fmtNum(lot.initial_qty)} {lot.unit}</dd>
              <dt className="text-slate-500">Khả dụng</dt><dd className="text-lg font-bold tabular-nums">{fmtNum(lot.available_qty)} {lot.unit}</dd>
              <dt className="text-slate-500">Trạng thái</dt><dd><StatusBadge code={lot.status} label={LOT_STATUS[lot.status]} /></dd>
              <dt className="text-slate-500">Hạng</dt><dd>{lot.grade ?? "—"}</dd>
              <dt className="text-slate-500">Đánh giá lúc</dt><dd>{fmtDateTime(lot.inspected_at)}</dd>
              <dt className="text-slate-500">Nhận xét</dt><dd>{lot.inspection_note ?? "—"}</dd>
            </dl>
          </Card>
          <Card title="Ghi kết quả đánh giá" className="lg:col-span-2">
            {can("lots.inspect") ? (
              <form onSubmit={inspect} className="grid gap-3 sm:grid-cols-3">
                <Field label="Hạng (do người đánh giá quyết định)">
                  <Select value={grade} onChange={(e) => setGrade(e.target.value)}>{["A", "B", "C"].map((g) => <option key={g}>{g}</option>)}</Select>
                </Field>
                <div className="sm:col-span-2"><Field label="Nhận xét"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: thịt đỏ đẹp, mỡ tốt" /></Field></div>
                {data.trades.length > 0 && (
                  <div className="sm:col-span-3"><Field label="Lô đã có giao dịch — lý do sửa (bắt buộc)"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div>
                )}
                <div><Button type="submit">Lưu kết quả</Button></div>
              </form>
            ) : <p className="text-sm text-slate-500">Chỉ vai trò Đánh giá hàng được ghi kết quả. Hệ thống không tự chấm điểm chất lượng.</p>}
          </Card>
          <div className="lg:col-span-3">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Giao dịch trên lô này</h2>
            <Table head={["Mã", "Ngày", "Loại", "Bút toán", "Người mua", "Số lượng", "Đơn giá", "Thành tiền", "Trạng thái"]} empty={data.trades.length === 0}>
              {data.trades.map((t) => (
                <tr key={t.id}>
                  <Td><Link href={`/trades/${t.id}`} className="text-sky-700 hover:underline">{t.code}</Link></Td>
                  <Td>{fmtDate(t.business_day)}</Td>
                  <Td>{TRADE_KIND[t.kind]}</Td>
                  <Td>{ENTRY_TYPE[t.entry_type]}</Td>
                  <Td>{t.buyer?.name}</Td>
                  <Td className="tabular-nums">{fmtNum(t.qty)}</Td>
                  <Td className="tabular-nums">{fmtYen(t.unit_price)}</Td>
                  <Td className="tabular-nums">{fmtYen(t.amount)}</Td>
                  <Td><StatusBadge code={t.status} label={TRADE_STATUS[t.status]} /></Td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      )}
    </RequirePermission>
  );
}
