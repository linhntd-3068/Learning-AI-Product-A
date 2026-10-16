"use client";
import { useState, type FormEvent } from "react";
import { useCan } from "@/components/current-user-context";
import { Button, Field, Input, Notice, Select, Textarea } from "@/components/ui-kit";
import { apiSend } from "@/lib/client/api-client";
import type { Participant } from "@/lib/client/domain-types";
import { BASIS, PARTICIPANT_STATUS } from "@/lib/client/format-and-labels";

// Status / validity / contact of one participant. Starts from the saved values; the parent remounts it
// (key = updated_at) after each save, so no effect is needed to copy server data into the form.
export function ParticipantValidityForm({ participant: p, onSaved }: { participant: Participant; onSaved: () => void }) {
  const can = useCan();
  const editable = can("participants.write");
  const [form, setForm] = useState({
    status: p.status, valid_from: p.valid_from, valid_to: p.valid_to, phone: p.phone ?? "", note: p.note ?? "", reason: "",
  });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await apiSend("PATCH", `/api/participants/${p.id}`, form);
      onSaved();
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    }
  }
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      {msg && <div className="sm:col-span-2"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      <Field label="Trạng thái">
        <Select value={form.status} onChange={set("status")} disabled={!editable}>
          {Object.entries(PARTICIPANT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Field>
      <Field label="Căn cứ"><Input value={BASIS[p.basis]} disabled /></Field>
      <Field label="Hiệu lực từ"><Input type="date" value={form.valid_from} onChange={set("valid_from")} disabled={!editable} /></Field>
      <Field label="Hiệu lực đến"><Input type="date" value={form.valid_to} onChange={set("valid_to")} disabled={!editable} /></Field>
      <Field label="Điện thoại"><Input value={form.phone} onChange={set("phone")} disabled={!editable} /></Field>
      <Field label="Ghi chú"><Input value={form.note} onChange={set("note")} disabled={!editable} /></Field>
      {editable && (
        <>
          <div className="sm:col-span-2">
            <Field label="Lý do thay đổi (bắt buộc)"><Textarea rows={2} required value={form.reason} onChange={set("reason")} /></Field>
          </div>
          <div className="sm:col-span-2"><Button type="submit">Lưu thay đổi</Button></div>
        </>
      )}
    </form>
  );
}
