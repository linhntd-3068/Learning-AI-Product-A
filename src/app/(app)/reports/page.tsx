"use client";
import { useCallback, useState } from "react";
import { BusinessDayPicker } from "@/components/business-day-picker";
import { RequirePermission } from "@/components/current-user-context";
import { Card, PageHeader } from "@/components/ui-kit";
import { fmtDate } from "@/lib/client/format-and-labels";

// Report export (SCR-038 / 051, reduced): CSV of every entry of a business day — the sample of
// the accounting export. In the real system it would be sent to the accounting system (IF-ACC-01).
export default function ReportsPage() {
  const [day, setDay] = useState("");
  const pickDay = useCallback((d: string) => setDay(d), []);
  return (
    <RequirePermission any={["reports.export"]}>
      <PageHeader title="Xuất báo cáo CSV" subtitle="Bản mẫu cho báo cáo ngày và dữ liệu xuất kế toán" actions={<BusinessDayPicker value={day} onChange={pickDay} />} />
      <Card title="Giao dịch theo ngày nghiệp vụ">
        <p className="mb-3 text-sm text-slate-600">
          Mọi bút toán của ngày (gốc, đảo, điều chỉnh, đã hủy) với lô, bên bán, người mua, số lượng, đơn giá, thành tiền.
          File UTF-8 có BOM để mở thẳng bằng Excel.
        </p>
        <a href={day ? `/api/reports/trades?day=${day}` : undefined} aria-disabled={!day}
          className="inline-block rounded-md bg-sky-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-800 aria-disabled:opacity-50">
          Tải CSV ngày {fmtDate(day)}
        </a>
      </Card>
    </RequirePermission>
  );
}
