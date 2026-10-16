"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { BusinessDayPicker } from "@/components/business-day-picker";
import { RequirePermission, useCan } from "@/components/current-user-context";
import { Button, Card, Notice, PageHeader, Stat, StatusBadge, Table, Td } from "@/components/ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";
import type { DeliveryRow } from "@/lib/client/domain-types";
import { DAY_STATUS, DELIVERY_STATE, ENTRY_TYPE, fmtDate, fmtDateTime, fmtNum, fmtYen } from "@/lib/client/format-and-labels";

type Totals = { count: number; qty: number; amount: number };
type Recon = {
  day: { day: string; status: string; locked_at: string | null };
  negotiated: Totals; auction: Totals; netAmount: number; cancelled: number;
  adjustments: { count: number; amount: number; rows: DeliveryRow[] };
  delivery: { done: number; partial: number; waiting: number; exception: number };
  issues: DeliveryRow[];
};

// Daily reconciliation (SCR-024) and closing the books for the day (SCR-025).
export default function ReconciliationPage() {
  const can = useCan();
  const [day, setDay] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const pickDay = useCallback((d: string) => { setDay(d); setConfirming(false); setMsg(null); }, []);
  const { data, error, reload } = useApi<Recon>(day ? `/api/reconciliation?day=${day}` : null);

  async function lock() {
    try {
      await apiSend("POST", `/api/business-days/${day}/lock`);
      setMsg({ kind: "success", text: `Đã khóa sổ ngày ${fmtDate(day)}. Từ giờ chỉ sửa được qua yêu cầu điều chỉnh.` });
      setConfirming(false);
      reload();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    }
  }

  const open = data?.day.status === "open";
  return (
    <RequirePermission any={["recon.read"]}>
      <PageHeader title="Đối soát ngày & khóa sổ" actions={<BusinessDayPicker value={day} onChange={pickDay} />} />
      <Notice>{error}</Notice>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Thỏa thuận" value={fmtYen(data.negotiated.amount)} note={`${data.negotiated.count} giao dịch · ${fmtNum(data.negotiated.qty)} đơn vị`} />
            <Stat label="Đấu giá" value={fmtYen(data.auction.amount)} note={`${data.auction.count} giao dịch · ${fmtNum(data.auction.qty)} đơn vị`} />
            <Stat label="Bút toán điều chỉnh ghi trong ngày" value={fmtYen(data.adjustments.amount)} note={`${data.adjustments.count} dòng`} />
            <Stat label="Tổng ròng của ngày" value={fmtYen(data.netAmount)} note={`Không tính ${data.cancelled} giao dịch đã hủy`} />
          </div>
          <div className="mb-4 grid gap-4 lg:grid-cols-3">
            <Card title="Giao hàng">
              <ul className="space-y-1 text-sm">
                {(["done", "partial", "waiting", "exception"] as const).map((k) => (
                  <li key={k} className="flex justify-between"><span>{DELIVERY_STATE[k]}</span><StatusBadge code={k} label={String(data.delivery[k])} /></li>
                ))}
              </ul>
            </Card>
            <Card title="Khóa sổ" className="lg:col-span-2">
              <p className="mb-3 text-sm">
                Trạng thái ngày {fmtDate(data.day.day)}: <StatusBadge code={data.day.status} label={DAY_STATUS[data.day.status]} />
                {data.day.locked_at && <span className="text-slate-500"> · khóa lúc {fmtDateTime(data.day.locked_at)}</span>}
              </p>
              {open && can("recon.lock") && !confirming && (
                <Button onClick={() => setConfirming(true)}>Khóa sổ ngày này…</Button>
              )}
              {open && confirming && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="mb-2">Còn <b>{data.issues.length}</b> giao dịch chưa giao xong hoặc có ngoại lệ. Sau khi khóa, không ai sửa trực tiếp được nữa. Tiếp tục?</p>
                  <div className="flex gap-2">
                    <Button variant="danger" onClick={lock}>Xác nhận khóa sổ</Button>
                    <Button variant="secondary" onClick={() => setConfirming(false)}>Thôi</Button>
                  </div>
                </div>
              )}
              {!open && <p className="text-sm text-slate-600">Ngày đã khóa. Mọi sửa đổi đi qua màn hình <Link href="/corrections" className="text-sky-700 hover:underline">Điều chỉnh sau khóa</Link>.</p>}
            </Card>
          </div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Cần xử lý: chưa giao xong hoặc có ngoại lệ</h2>
          <Table head={["Giao dịch", "Bút toán", "Mặt hàng", "Người mua", "Đã bán", "Đã giao", "Còn lại", "Trạng thái"]} empty={data.issues.length === 0}>
            {data.issues.map((r) => (
              <tr key={r.id}>
                <Td><Link href={`/trades/${r.id}`} className="text-sky-700 hover:underline">{r.code}</Link></Td>
                <Td>{ENTRY_TYPE[r.entry_type]}</Td>
                <Td>{r.lot?.item}</Td>
                <Td>{r.buyer?.name}</Td>
                <Td className="tabular-nums">{fmtNum(r.qty)}</Td>
                <Td className="tabular-nums">{fmtNum(r.delivered)}</Td>
                <Td className="tabular-nums">{fmtNum(r.remaining)}</Td>
                <Td><StatusBadge code={r.state} label={DELIVERY_STATE[r.state]} /></Td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </RequirePermission>
  );
}
