"use client";
import { useCallback, useState, type FormEvent } from "react";
import { BusinessDayPicker } from "./business-day-picker";
import { Button, Card, Field, Input, Notice, Select } from "./ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";
import type { Lot, Participant, Trade } from "@/lib/client/domain-types";
import { PARTICIPANT_KIND, PARTICIPANT_STATUS, fmtNum, fmtYen } from "@/lib/client/format-and-labels";

// Shared entry form: negotiated trade (SCR-016, main flow) or final auction result (SCR-019).
// Keyboard-first: Enter submits, focus returns to the quantity field. Invalid buyers stay selectable so the
// refusal reason from the server is visible — the system blocks them, the form does not hide them.
export function TradeEntryForm({ kind, onSaved }: { kind: "negotiated" | "auction"; onSaved: (t: Trade) => void }) {
  const [day, setDay] = useState("");
  const pickDay = useCallback((d: string) => setDay(d), []);
  const { data: lots, reload: reloadLots } = useApi<Lot[]>(day ? `/api/lots?day=${day}&available=1` : null);
  const { data: people } = useApi<Participant[]>("/api/participants");
  const buyers = (people ?? []).filter((p) => p.kind !== "wholesaler");
  const [f, setF] = useState({ lot_id: "", buyer_id: "", qty: "", unit_price: "", note: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const lot = (lots ?? []).find((l) => String(l.id) === f.lot_id);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const t = await apiSend<Trade>("POST", "/api/trades", {
        kind, lot_id: Number(f.lot_id), buyer_id: Number(f.buyer_id), qty: Number(f.qty), unit_price: Number(f.unit_price), note: f.note,
      });
      setMsg({ kind: "success", text: `Đã ${kind === "auction" ? "ghi kết quả đấu giá" : "chốt giao dịch"} ${t.code}: ${fmtNum(t.qty)} × ${fmtYen(t.unit_price)} = ${fmtYen(t.amount)}` });
      setF({ ...f, qty: "", unit_price: "", note: "" });
      reloadLots();
      onSaved(t);
      document.getElementById("trade-qty")?.focus();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const buyerFlag = (p: Participant) =>
    p.status !== "active" ? ` ⚠ ${PARTICIPANT_STATUS[p.status]}` : p.valid_to < today ? " ⚠ hết hạn" : "";

  return (
    <Card className="mb-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <BusinessDayPicker value={day} onChange={pickDay} onlyOpen />
        {lot && <span className="text-sm text-slate-600">Lô {lot.code}: còn <b className="tabular-nums">{fmtNum(lot.available_qty)} {lot.unit}</b></span>}
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Field label="Lô hàng (còn hàng)">
            <Select required autoFocus value={f.lot_id} onChange={set("lot_id")}>
              <option value="">— Chọn lô —</option>
              {(lots ?? []).map((l) => <option key={l.id} value={l.id}>{l.code} · {l.item} · còn {fmtNum(l.available_qty)} {l.unit}</option>)}
            </Select>
          </Field>
        </div>
        <div className="lg:col-span-2">
          <Field label={kind === "auction" ? "Người trúng đấu giá" : "Người mua"}>
            <Select required value={f.buyer_id} onChange={set("buyer_id")}>
              <option value="">— Chọn —</option>
              {buyers.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name} ({PARTICIPANT_KIND[p.kind]}){buyerFlag(p)}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={`Số lượng${lot ? ` (${lot.unit})` : ""}`}>
          <Input id="trade-qty" required type="number" min="0.01" step="0.01" value={f.qty} onChange={set("qty")} />
        </Field>
        <Field label="Đơn giá (¥)"><Input required type="number" min="0" step="1" value={f.unit_price} onChange={set("unit_price")} /></Field>
        <div className="sm:col-span-2 lg:col-span-4"><Field label="Ghi chú"><Input value={f.note} onChange={set("note")} /></Field></div>
        <div className="flex items-end gap-3 lg:col-span-2">
          <Button type="submit" disabled={busy || !day}>{kind === "auction" ? "Ghi kết quả" : "Chốt giao dịch"}</Button>
          {f.qty && f.unit_price && <span className="text-sm tabular-nums text-slate-600">= {fmtYen(Number(f.qty) * Number(f.unit_price))}</span>}
        </div>
      </form>
    </Card>
  );
}
