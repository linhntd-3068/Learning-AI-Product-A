"use client";
import Link from "next/link";
import { Card, Notice, PageHeader, Stat, StatusBadge, Table, Td } from "@/components/ui-kit";
import { useMe } from "@/components/current-user-context";
import { useApi } from "@/lib/client/api-client";
import { BASIS, DAY_STATUS, PARTICIPANT_KIND, fmtDate, fmtYen } from "@/lib/client/format-and-labels";

type Dashboard = {
  currentDay: { day: string; status: string } | null;
  tradeCount: number; negotiatedCount: number; auctionCount: number; tradeAmount: number;
  pendingCorrections: number; openDeliveries: number;
  expiring: { id: number; code: string; name: string; kind: string; basis: string; valid_to: string; expired: boolean }[];
};

// Home screen (SCR-003): today's figures and alerts that need action.
export default function HomePage() {
  const me = useMe();
  const { data, error } = useApi<Dashboard>("/api/dashboard");

  return (
    <>
      <PageHeader title={`Xin chào, ${me.fullName}`} subtitle={`Vai trò: ${me.roleName}`} />
      <Notice>{error}</Notice>
      {data && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Ngày nghiệp vụ" value={data.currentDay ? fmtDate(data.currentDay.day) : "—"}
              note={data.currentDay ? DAY_STATUS[data.currentDay.status] : "Chưa mở ngày"} />
            <Stat label="Giao dịch trong ngày" value={data.tradeCount}
              note={`Thỏa thuận ${data.negotiatedCount} · Đấu giá ${data.auctionCount}`} />
            <Stat label="Giá trị giao dịch" value={fmtYen(data.tradeAmount)} note="Chưa thuế, giao dịch gốc đã chốt" />
            <Stat label="Giao dịch chưa giao xong" value={data.openDeliveries} note="Mọi ngày" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Cảnh báo" className="lg:col-span-1">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <Link href="/corrections" className="text-sky-700 hover:underline">Yêu cầu điều chỉnh chờ duyệt</Link>
                  <StatusBadge code={data.pendingCorrections ? "pending" : "done"} label={String(data.pendingCorrections)} />
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/deliveries" className="text-sky-700 hover:underline">Giao dịch chưa giao xong</Link>
                  <StatusBadge code={data.openDeliveries ? "partial" : "done"} label={String(data.openDeliveries)} />
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/participants" className="text-sky-700 hover:underline">Tư cách sắp / đã hết hạn</Link>
                  <StatusBadge code={data.expiring.length ? "pending" : "done"} label={String(data.expiring.length)} />
                </li>
              </ul>
            </Card>

            <div className="lg:col-span-2">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Hết hạn trong 30 ngày tới</h2>
              <Table head={["Mã", "Người tham gia", "Loại", "Căn cứ", "Hết hạn"]} empty={data.expiring.length === 0}>
                {data.expiring.map((p) => (
                  <tr key={p.id}>
                    <Td><Link href={`/participants/${p.id}`} className="text-sky-700 hover:underline">{p.code}</Link></Td>
                    <Td>{p.name}</Td>
                    <Td>{PARTICIPANT_KIND[p.kind]}</Td>
                    <Td>{BASIS[p.basis]}</Td>
                    <Td><StatusBadge code={p.expired ? "expired" : "pending"} label={fmtDate(p.valid_to)} /></Td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
