"use client";
import { useState, type FormEvent } from "react";
import { Button, Card, Field, Input, Notice, Select } from "@/components/ui-kit";
import { apiSend, useApi } from "@/lib/client/api-client";
import type { Lot, Participant } from "@/lib/client/domain-types";

const UNITS = ["kg", "thùng", "con", "khay"];

// Lot intake (SCR-012): the database assigns the lot code; seller must be a valid wholesaler.
export function LotIntakeForm({ day, onCreated }: { day: string; onCreated: () => void }) {
  const { data: sellers } = useApi<Participant[]>("/api/participants?kind=wholesaler");
  const [f, setF] = useState({ seller_id: "", shipper: "", item: "", unit: "kg", qty: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const lot = await apiSend<Lot>("POST", "/api/lots", { ...f, day, seller_id: Number(f.seller_id), qty: Number(f.qty) });
      setMsg({ kind: "success", text: `Đã tiếp nhận lô ${lot.code}` });
      setF({ ...f, shipper: "", item: "", qty: "" });
      onCreated();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  return (
    <Card title="Tiếp nhận lô mới" className="mb-4">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Bên bán (nhà phân phối)">
          <Select required value={f.seller_id} onChange={set("seller_id")}>
            <option value="">— Chọn —</option>
            {(sellers ?? []).map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
          </Select>
        </Field>
        <Field label="Chủ hàng"><Input required value={f.shipper} onChange={set("shipper")} placeholder="VD: JF Sakura-hama" /></Field>
        <Field label="Mặt hàng"><Input required value={f.item} onChange={set("item")} placeholder="VD: Cá ngừ" /></Field>
        <Field label="Đơn vị">
          <Select value={f.unit} onChange={set("unit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</Select>
        </Field>
        <Field label="Số lượng"><Input required type="number" min="0.01" step="0.01" value={f.qty} onChange={set("qty")} /></Field>
        <div className="flex items-end"><Button type="submit" disabled={busy || !day}>Tiếp nhận</Button></div>
      </form>
    </Card>
  );
}
