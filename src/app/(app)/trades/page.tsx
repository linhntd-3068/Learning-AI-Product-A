"use client";
import { useCallback, useState } from "react";
import { BusinessDayPicker } from "@/components/business-day-picker";
import { RequirePermission } from "@/components/current-user-context";
import { TradeTable } from "@/components/trade-table";
import { Notice, PageHeader, Select } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import type { Trade } from "@/lib/client/domain-types";

// Trade list of a business day (SCR-017): negotiated and auction, including reversal / adjusted entries.
export default function TradesPage() {
  const [day, setDay] = useState("");
  const [kind, setKind] = useState("");
  const pickDay = useCallback((d: string) => setDay(d), []);
  const { data, error } = useApi<Trade[]>(day ? `/api/trades?day=${day}${kind ? `&kind=${kind}` : ""}` : null);

  return (
    <RequirePermission any={["trades.read"]}>
      <PageHeader title="Danh sách giao dịch" actions={
        <div className="flex flex-wrap gap-3">
          <BusinessDayPicker value={day} onChange={pickDay} />
          <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Loại giao dịch">
            <option value="">Tất cả loại</option>
            <option value="negotiated">Thỏa thuận</option>
            <option value="auction">Đấu giá</option>
          </Select>
        </div>
      } />
      <Notice>{error}</Notice>
      <TradeTable trades={data ?? []} />
    </RequirePermission>
  );
}
