"use client";
import { RequirePermission } from "@/components/current-user-context";
import { TradeEntryForm } from "@/components/trade-entry-form";
import { TradeTable } from "@/components/trade-table";
import { PageHeader } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import type { Trade } from "@/lib/client/domain-types";

// Negotiated trade entry (SCR-016): the main flow, about 90% of trades.
export default function NewNegotiatedTradePage() {
  const { data, reload } = useApi<Trade[]>("/api/trades?kind=negotiated");
  return (
    <RequirePermission any={["trades.create"]}>
      <PageHeader title="Nhập giao dịch thỏa thuận"
        subtitle="Luồng chính (~90% giao dịch). Hệ thống từ chối nếu người mua hết hiệu lực, lô không đủ hàng hoặc ngày đã khóa sổ." />
      <TradeEntryForm kind="negotiated" onSaved={reload} />
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Giao dịch thỏa thuận gần đây</h2>
      <TradeTable trades={(data ?? []).slice(0, 15)} />
    </RequirePermission>
  );
}
