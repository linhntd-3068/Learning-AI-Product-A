"use client";
import { useState, type FormEvent } from "react";
import { useCan } from "@/components/current-user-context";
import { Button, Card, Field, Input, Notice } from "@/components/ui-kit";
import { apiSend } from "@/lib/client/api-client";

// Actions on one trade: cancel while the day is open (SCR-018), or ask for a correction once it is locked (SCR-021).
export function TradeActions({ tradeId, dayOpen, live, qty, unitPrice, hasDeliveries, onDone }: {
  tradeId: number; dayOpen: boolean; live: boolean; qty: number; unitPrice: number; hasDeliveries: boolean; onDone: () => void;
}) {
  const can = useCan();
  const [reason, setReason] = useState("");
  const [corr, setCorr] = useState({ new_qty: String(qty), new_unit_price: String(unitPrice), reason: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      setMsg({ kind: "success", text: ok });
      onDone();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    }
  }
  const cancel = (e: FormEvent) => {
    e.preventDefault();
    run(() => apiSend("POST", `/api/trades/${tradeId}/cancel`, { reason }), "Đã hủy giao dịch, số lượng đã trả lại lô");
  };
  const requestCorrection = (e: FormEvent) => {
    e.preventDefault();
    run(() => apiSend("POST", "/api/corrections", {
      trade_id: tradeId, new_qty: Number(corr.new_qty), new_unit_price: Number(corr.new_unit_price), reason: corr.reason,
    }), "Đã gửi yêu cầu điều chỉnh — chờ người khác duyệt");
  };

  if (!live) return null;
  const canCancel = can("trades.cancel") && dayOpen && !hasDeliveries;
  const canCorrect = can("corrections.request");
  if (!canCancel && !canCorrect) return null;

  return (
    <Card title="Thao tác">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {canCancel && (
        <form onSubmit={cancel} className="mb-4 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1"><Field label="Hủy giao dịch — lý do"><Input required value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div>
          <Button variant="danger" type="submit">Hủy giao dịch</Button>
        </form>
      )}
      {canCorrect && (
        <form onSubmit={requestCorrection} className="grid gap-2 sm:grid-cols-4">
          <p className="text-sm text-slate-600 sm:col-span-4">
            {dayOpen ? "Ngày còn mở: có thể hủy và nhập lại; yêu cầu điều chỉnh vẫn dùng được." : "Ngày đã khóa sổ: chỉ sửa được qua yêu cầu điều chỉnh có người duyệt."}
          </p>
          <Field label="Số lượng mới"><Input type="number" min="0.01" step="0.01" value={corr.new_qty} onChange={(e) => setCorr({ ...corr, new_qty: e.target.value })} /></Field>
          <Field label="Đơn giá mới (¥)"><Input type="number" min="0" value={corr.new_unit_price} onChange={(e) => setCorr({ ...corr, new_unit_price: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Lý do (bắt buộc)"><Input required value={corr.reason} onChange={(e) => setCorr({ ...corr, reason: e.target.value })} /></Field></div>
          <div><Button type="submit" variant="secondary">Gửi yêu cầu điều chỉnh</Button></div>
        </form>
      )}
    </Card>
  );
}
