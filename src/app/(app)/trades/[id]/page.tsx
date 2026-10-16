"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RequirePermission, useCan } from "@/components/current-user-context";
import { Card, Notice, PageHeader, StatusBadge, Table, Td } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import type { Trade } from "@/lib/client/domain-types";
import {
  CORRECTION_STATUS, DAY_STATUS, ENTRY_TYPE, EXCEPTION_TYPE, TRADE_KIND, TRADE_STATUS, fmtDate, fmtDateTime, fmtNum, fmtYen,
} from "@/lib/client/format-and-labels";
import { TradeActions } from "./trade-actions";

type Detail = {
  trade: Trade & { lot: { id: number; code: string; item: string; unit: string } | null; buyer: { id: number; code: string; name: string } | null; day: { status: string } | null };
  deliveries: { id: number; seq: number; qty: number; kind: string; exception_type: string | null; note: string | null; recorded_at: string }[];
  corrections: { id: number; new_qty: number; new_unit_price: number; reason: string; status: string; requested_at: string; decision_note: string | null }[];
  linked: { id: number; code: string; business_day: string; entry_type: string; qty: number; unit_price: number; amount: number }[];
  delivered: number; remaining: number;
};

// Trade detail (SCR-018): status, deliveries so far, corrections and the reversal / adjusted entries they created.
export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const { data, error, reload } = useApi<Detail>(`/api/trades/${id}`);
  const t = data?.trade;
  const live = t?.status === "confirmed" && Number(t.qty) > 0;

  return (
    <RequirePermission any={["trades.read", "auction.record"]}>
      <PageHeader title={t ? `Giao dịch ${t.code}` : "Giao dịch"}
        subtitle={t ? `${TRADE_KIND[t.kind]} · ${ENTRY_TYPE[t.entry_type]} · ngày ${fmtDate(t.business_day)} (${DAY_STATUS[t.day?.status ?? "open"]})` : undefined}
        actions={<Link href="/trades" className="text-sm text-sky-700 hover:underline">← Danh sách</Link>} />
      <Notice>{error}</Notice>
      {t && data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Nội dung">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Trạng thái</dt><dd><StatusBadge code={t.status} label={TRADE_STATUS[t.status]} /></dd>
              <dt className="text-slate-500">Lô</dt><dd>{t.lot && <Link href={`/lots/${t.lot.id}`} className="text-sky-700 hover:underline">{t.lot.code}</Link>} · {t.lot?.item}</dd>
              <dt className="text-slate-500">Bên bán</dt><dd>{t.seller?.name}</dd>
              <dt className="text-slate-500">Người mua</dt><dd>{t.buyer && <Link href={`/participants/${t.buyer.id}`} className="text-sky-700 hover:underline">{t.buyer.name}</Link>}</dd>
              <dt className="text-slate-500">Số lượng × đơn giá</dt><dd className="tabular-nums">{fmtNum(t.qty)} {t.lot?.unit} × {fmtYen(t.unit_price)}</dd>
              <dt className="text-slate-500">Thành tiền</dt><dd className="text-lg font-bold tabular-nums">{fmtYen(t.amount)}</dd>
              <dt className="text-slate-500">Chốt lúc</dt><dd>{fmtDateTime(t.confirmed_at)}</dd>
              <dt className="text-slate-500">Ghi chú</dt><dd>{t.note ?? "—"}</dd>
            </dl>
          </Card>
          <Card title="Giao hàng">
            <p className="mb-2 text-sm">Đã giao <b className="tabular-nums">{fmtNum(data.delivered)}</b> · còn lại <b className="tabular-nums">{fmtNum(data.remaining)}</b> {t.lot?.unit}
              {live && can("deliveries.record") && <> · <Link href={`/deliveries/${t.id}`} className="text-sky-700 hover:underline">Ghi giao hàng →</Link></>}
            </p>
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
          </Card>
          <TradeActions tradeId={t.id} dayOpen={t.day?.status === "open"} live={live} qty={Number(t.qty)}
            unitPrice={Number(t.unit_price)} hasDeliveries={data.deliveries.length > 0} onDone={reload} />
          {(data.corrections.length > 0 || data.linked.length > 0) && (
            <Card title="Điều chỉnh">
              {data.corrections.map((c) => (
                <p key={c.id} className="mb-2 text-sm">
                  <StatusBadge code={c.status} label={CORRECTION_STATUS[c.status]} /> SL {fmtNum(c.new_qty)} × {fmtYen(c.new_unit_price)} — {c.reason}
                  {c.decision_note && <span className="text-slate-500"> (ý kiến duyệt: {c.decision_note})</span>}
                </p>
              ))}
              {data.linked.map((l) => (
                <p key={l.id} className="text-sm"><Link href={`/trades/${l.id}`} className="text-sky-700 hover:underline">{l.code}</Link> · {ENTRY_TYPE[l.entry_type]} · ngày {fmtDate(l.business_day)} · {fmtNum(l.qty)} × {fmtYen(l.unit_price)} = {fmtYen(l.amount)}</p>
              ))}
            </Card>
          )}
        </div>
      )}
    </RequirePermission>
  );
}
