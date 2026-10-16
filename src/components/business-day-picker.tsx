"use client";
import { useEffect } from "react";
import { useApi } from "@/lib/client/api-client";
import { DAY_STATUS, fmtDate } from "@/lib/client/format-and-labels";

export type BusinessDay = { day: string; status: string; locked_at: string | null };

// Business-day selector; picks the newest day on first load.
export function BusinessDayPicker({ value, onChange, onlyOpen = false }: {
  value: string; onChange: (day: string, info?: BusinessDay) => void; onlyOpen?: boolean;
}) {
  const { data } = useApi<BusinessDay[]>("/api/business-days");
  const days = (data ?? []).filter((d) => !onlyOpen || d.status === "open");

  useEffect(() => {
    if (!value && days.length) onChange(days[0].day, days[0]);
  }, [value, days, onChange]);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">Ngày nghiệp vụ</span>
      <select className="rounded-md border border-slate-300 bg-white px-2 py-1" value={value}
        onChange={(e) => onChange(e.target.value, days.find((d) => d.day === e.target.value))}>
        {days.map((d) => <option key={d.day} value={d.day}>{fmtDate(d.day)} — {DAY_STATUS[d.status]}</option>)}
      </select>
    </label>
  );
}
