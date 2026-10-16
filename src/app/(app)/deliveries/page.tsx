"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { BusinessDayPicker } from "@/components/business-day-picker";
import { RequirePermission, useCan } from "@/components/current-user-context";
import { Notice, PageHeader, Select, StatusBadge, Table, Td } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import type { DeliveryRow } from "@/lib/client/domain-types";
import { DELIVERY_STATE, TRADE_KIND, fmtNum } from "@/lib/client/format-and-labels";

// Delivery work list (SCR-028): what is waiting, in progress, done or has an exception.
export default function DeliveriesPage() {
  const can = useCan();
  const [day, setDay] = useState("");
  const [state, setState] = useState("open");
  const pickDay = useCallback((d: string) => setDay(d), []);
  const { data, error } = useApi<DeliveryRow[]>(day ? `/api/deliveries?day=${day}` : null);
  const rows = (data ?? []).filter((r) => state === "all" || (state === "open" ? r.state !== "done" : r.state === state));

  return (
    <RequirePermission any={["deliveries.record", "trades.read"]}>
      <PageHeader title="Giao hàng" subtitle="Một giao dịch có thể giao nhiều chuyến; hệ thống cộng dồn và báo phần còn lại" actions={
        <div className="flex flex-wrap gap-3">
          <BusinessDayPicker value={day} onChange={pickDay} />
          <Select value={state} onChange={(e) => setState(e.target.value)} aria-label="Lọc trạng thái">
            <option value="open">Chưa xong</option>
            <option value="all">Tất cả</option>
            {Object.entries(DELIVERY_STATE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
      } />
      <Notice>{error}</Notice>
      <Table head={["Giao dịch", "Loại", "Mặt hàng", "Người mua", "Đã bán", "Đã giao", "Còn lại", "Trạng thái", ""]} empty={!!data && rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50">
            <Td><Link href={`/trades/${r.id}`} className="text-sky-700 hover:underline">{r.code}</Link></Td>
            <Td>{TRADE_KIND[r.kind]}</Td>
            <Td>{r.lot?.item}</Td>
            <Td>{r.buyer?.name}</Td>
            <Td className="tabular-nums">{fmtNum(r.qty)} {r.lot?.unit}</Td>
            <Td className="tabular-nums">{fmtNum(r.delivered)}</Td>
            <Td className="tabular-nums font-medium">{fmtNum(r.remaining)}</Td>
            <Td><StatusBadge code={r.state} label={DELIVERY_STATE[r.state]} /></Td>
            <Td>{can("deliveries.record") && <Link href={`/deliveries/${r.id}`} className="whitespace-nowrap text-sky-700 hover:underline">Ghi giao →</Link>}</Td>
          </tr>
        ))}
      </Table>
    </RequirePermission>
  );
}
