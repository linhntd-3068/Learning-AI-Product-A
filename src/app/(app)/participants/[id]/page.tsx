"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { RequirePermission } from "@/components/current-user-context";
import { Card, Notice, PageHeader, StatusBadge, Table, Td } from "@/components/ui-kit";
import { useApi } from "@/lib/client/api-client";
import type { Participant } from "@/lib/client/domain-types";
import { BASIS, PARTICIPANT_KIND, TRADE_KIND, TRADE_STATUS, fmtDate, fmtNum, fmtYen } from "@/lib/client/format-and-labels";
import { ParticipantValidityForm } from "./participant-validity-form";

type Detail = {
  participant: Participant;
  trades: { id: number; code: string; business_day: string; kind: string; qty: number; amount: number; status: string; lots: { item: string; unit: string } | null }[];
};

// Participant detail (SCR-010): legal basis, validity period and status, with audited edits.
export default function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useApi<Detail>(`/api/participants/${id}`);
  const [saved, setSaved] = useState(false);
  const p = data?.participant;

  return (
    <RequirePermission any={["participants.read"]}>
      <PageHeader title={p ? `${p.code} · ${p.name}` : "Người tham gia"}
        subtitle={p ? `${PARTICIPANT_KIND[p.kind]} · căn cứ: ${BASIS[p.basis]}` : undefined}
        actions={<Link href="/participants" className="text-sm text-sky-700 hover:underline">← Danh sách</Link>} />
      <Notice>{error}</Notice>
      {saved && <Notice kind="success">Đã lưu thay đổi (có ghi audit log)</Notice>}
      {p && data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Tư cách tham gia">
            <ParticipantValidityForm key={p.updated_at} participant={p} onSaved={() => { setSaved(true); reload(); }} />
          </Card>
          <Card title="Giao dịch gần đây">
            <Table head={["Mã", "Ngày", "Loại", "Mặt hàng", "SL", "Thành tiền", "Trạng thái"]} empty={data.trades.length === 0}>
              {data.trades.map((t) => (
                <tr key={t.id}>
                  <Td><Link href={`/trades/${t.id}`} className="text-sky-700 hover:underline">{t.code}</Link></Td>
                  <Td>{fmtDate(t.business_day)}</Td>
                  <Td>{TRADE_KIND[t.kind]}</Td>
                  <Td>{t.lots?.item}</Td>
                  <Td className="tabular-nums">{fmtNum(t.qty)} {t.lots?.unit}</Td>
                  <Td className="tabular-nums">{fmtYen(t.amount)}</Td>
                  <Td><StatusBadge code={t.status} label={TRADE_STATUS[t.status]} /></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}
    </RequirePermission>
  );
}
