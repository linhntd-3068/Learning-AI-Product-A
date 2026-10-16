import { ApiError, check, guard } from "@/lib/api/route-guard";
import { writeAuditLog } from "@/lib/api/write-audit-log";

const HEADER = ["Ngày nghiệp vụ", "Mã giao dịch", "Loại", "Bút toán", "Trạng thái", "Mã lô", "Mặt hàng", "Đơn vị",
  "Bên bán", "Người mua", "Số lượng", "Đơn giá (JPY)", "Thành tiền (JPY)"];
const KIND: Record<string, string> = { negotiated: "Thỏa thuận", auction: "Đấu giá" };
const ENTRY: Record<string, string> = { original: "Gốc", reversal: "Đảo", adjusted: "Điều chỉnh" };
const STATUS: Record<string, string> = { confirmed: "Đã chốt", cancelled: "Đã hủy", reversed: "Đã điều chỉnh" };

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// CSV of every entry of a business day (?day=) — the sample of the accounting export (IF-ACC-01, mocked as a download).
export async function GET(request: Request) {
  return guard("reports.export", async (g) => {
    const day = new URL(request.url).searchParams.get("day");
    if (!day) throw new ApiError(400, "Chọn ngày nghiệp vụ");
    const rows = check(await g.db.from("trades")
      .select("code, business_day, kind, entry_type, status, qty, unit_price, amount, lot:lots(code, item, unit), seller:participants!trades_seller_id_fkey(name), buyer:participants!trades_buyer_id_fkey(name)")
      .eq("business_day", day).order("id")) as unknown as {
        code: string; business_day: string; kind: string; entry_type: string; status: string; qty: number; unit_price: number; amount: number;
        lot: { code: string; item: string; unit: string } | null; seller: { name: string } | null; buyer: { name: string } | null;
      }[];
    const lines = [HEADER.map(cell).join(",")].concat(rows.map((r) => [
      r.business_day, r.code, KIND[r.kind], ENTRY[r.entry_type], STATUS[r.status], r.lot?.code, r.lot?.item, r.lot?.unit,
      r.seller?.name, r.buyer?.name, r.qty, r.unit_price, r.amount,
    ].map(cell).join(",")));
    await writeAuditLog(g, { action: "export_csv", entity: "report", entityId: `trades-${day}` });
    return new Response("﻿" + lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="giao-dich-${day}.csv"`,
      },
    });
  });
}
