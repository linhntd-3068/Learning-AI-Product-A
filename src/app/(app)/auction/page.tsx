"use client";
import { RequirePermission } from "@/components/current-user-context";
import { TradeEntryForm } from "@/components/trade-entry-form";
import { TradeTable } from "@/components/trade-table";
import { PageHeader } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import type { Trade } from "@/lib/client/domain-types";

// Auction results (SCR-019 / 020): only the final result is recorded — no live bidding, no hand-sign recognition.
export default function AuctionPage() {
  const { data, reload } = useApi<Trade[]>("/api/trades?kind=auction");
  return (
    <RequirePermission any={["auction.record"]}>
      <PageHeader title="Ghi kết quả đấu giá"
        subtitle="Chỉ ghi kết quả cuối do người điều hành xác nhận: người trúng, số lượng, đơn giá. Không có đấu giá trực tuyến." />
      <TradeEntryForm kind="auction" onSaved={reload} />
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Kết quả đấu giá đã ghi</h2>
      <TradeTable trades={data ?? []} />
    </RequirePermission>
  );
}
