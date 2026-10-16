"use client";
import Link from "next/link";
import { StatusBadge, Table, Td } from "./ui-kit";
import type { Trade } from "@/lib/client/domain-types";
import { ENTRY_TYPE, TRADE_KIND, TRADE_STATUS, fmtDateTime, fmtNum, fmtYen } from "@/lib/client/format-and-labels";

// Trade rows shared by the trade list, the negotiated entry screen and the auction screen.
export function TradeTable({ trades }: { trades: Trade[] }) {
  return (
    <Table head={["Mã", "Loại", "Bút toán", "Lô / mặt hàng", "Người mua", "Số lượng", "Đơn giá", "Thành tiền", "Trạng thái", "Lúc chốt"]}
      empty={trades.length === 0}>
      {trades.map((t) => (
        <tr key={t.id} className={`hover:bg-slate-50 ${t.status === "cancelled" ? "text-slate-400 line-through" : ""}`}>
          <Td><Link href={`/trades/${t.id}`} className="font-medium text-sky-700 hover:underline">{t.code}</Link></Td>
          <Td>{TRADE_KIND[t.kind]}</Td>
          <Td>{ENTRY_TYPE[t.entry_type]}</Td>
          <Td>{t.lot?.code} · {t.lot?.item}</Td>
          <Td>{t.buyer?.name}</Td>
          <Td className="tabular-nums">{fmtNum(t.qty)} {t.lot?.unit}</Td>
          <Td className="tabular-nums">{fmtYen(t.unit_price)}</Td>
          <Td className="tabular-nums">{fmtYen(t.amount)}</Td>
          <Td><StatusBadge code={t.status} label={TRADE_STATUS[t.status]} /></Td>
          <Td className="whitespace-nowrap text-slate-500">{fmtDateTime(t.confirmed_at)}</Td>
        </tr>
      ))}
    </Table>
  );
}
