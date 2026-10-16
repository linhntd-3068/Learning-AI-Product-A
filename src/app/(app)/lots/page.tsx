"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { BusinessDayPicker, type BusinessDay } from "@/components/business-day-picker";
import { RequirePermission, useCan } from "@/components/current-user-context";
import { Notice, PageHeader, StatusBadge, Table, Td } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import type { Lot } from "@/lib/client/domain-types";
import { LOT_STATUS, fmtNum } from "@/lib/client/format-and-labels";
import { LotIntakeForm } from "./lot-intake-form";

// Lot list of a business day (SCR-014) with the intake form (SCR-012) for intake staff.
export default function LotsPage() {
  const can = useCan();
  const [day, setDay] = useState("");
  const [dayInfo, setDayInfo] = useState<BusinessDay | undefined>();
  const { data, error, reload } = useApi<Lot[]>(day ? `/api/lots?day=${day}` : null);
  const pickDay = useCallback((d: string, info?: BusinessDay) => { setDay(d); setDayInfo(info); }, []);

  return (
    <RequirePermission any={["lots.read"]}>
      <PageHeader title="Lô hàng" subtitle="Tiếp nhận, đánh giá và số lượng khả dụng của từng lô"
        actions={<BusinessDayPicker value={day} onChange={pickDay} />} />
      {can("lots.create") && dayInfo?.status === "open" && <LotIntakeForm day={day} onCreated={reload} />}
      {dayInfo?.status === "locked" && <Notice kind="info">Ngày này đã khóa sổ: chỉ xem, không tiếp nhận thêm lô.</Notice>}
      <Notice>{error}</Notice>
      <Table head={["Mã lô", "Mặt hàng", "Bên bán", "Chủ hàng", "Ban đầu", "Khả dụng", "Hạng", "Trạng thái"]} empty={!!data && data.length === 0}>
        {(data ?? []).map((l) => (
          <tr key={l.id} className="hover:bg-slate-50">
            <Td><Link href={`/lots/${l.id}`} className="font-medium text-sky-700 hover:underline">{l.code}</Link></Td>
            <Td>{l.item}</Td>
            <Td>{l.seller?.name}</Td>
            <Td>{l.shipper}</Td>
            <Td className="tabular-nums">{fmtNum(l.initial_qty)} {l.unit}</Td>
            <Td className="tabular-nums font-medium">{fmtNum(l.available_qty)} {l.unit}</Td>
            <Td>{l.grade ?? <span className="text-slate-400">chưa đánh giá</span>}</Td>
            <Td><StatusBadge code={l.status} label={LOT_STATUS[l.status]} /></Td>
          </tr>
        ))}
      </Table>
    </RequirePermission>
  );
}
