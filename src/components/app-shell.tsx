"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { apiSend, useApi } from "@/lib/client/api-client";
import { MeProvider, type Me } from "./current-user-context";

// Menu entries in the order of a business day; each shows only for roles that hold one of `perm`.
const NAV: { href: string; label: string; perm: string[]; group: string }[] = [
  { href: "/", label: "Trang chủ", perm: [], group: "" },
  { href: "/participants", label: "Người tham gia", perm: ["participants.read"], group: "Danh mục" },
  { href: "/lots", label: "Lô hàng", perm: ["lots.read"], group: "Trong ngày" },
  { href: "/trades/new", label: "Nhập giao dịch thỏa thuận", perm: ["trades.create"], group: "Trong ngày" },
  { href: "/auction", label: "Ghi kết quả đấu giá", perm: ["auction.record"], group: "Trong ngày" },
  { href: "/trades", label: "Danh sách giao dịch", perm: ["trades.read"], group: "Trong ngày" },
  { href: "/deliveries", label: "Giao hàng", perm: ["deliveries.record", "trades.read"], group: "Trong ngày" },
  { href: "/reconciliation", label: "Đối soát & khóa sổ", perm: ["recon.read"], group: "Cuối ngày" },
  { href: "/corrections", label: "Điều chỉnh sau khóa", perm: ["corrections.request", "corrections.approve"], group: "Cuối ngày" },
  { href: "/reports", label: "Xuất báo cáo CSV", perm: ["reports.export"], group: "Cuối ngày" },
  { href: "/audit", label: "Audit log", perm: ["audit.read"], group: "Quản trị" },
  { href: "/admin/users", label: "Tài khoản", perm: ["admin.users"], group: "Quản trị" },
  { href: "/admin/roles", label: "Vai trò & phân quyền", perm: ["admin.roles"], group: "Quản trị" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me, error } = useApi<Me>("/api/me");
  const pathname = usePathname();
  const router = useRouter();

  if (error) return <p className="p-6 text-sm text-rose-700">{error}</p>;
  if (!me) return <p className="p-6 text-sm text-slate-500">Đang tải…</p>;

  const items = NAV.filter((n) => n.perm.length === 0 || n.perm.some((p) => me.permissions.includes(p)));
  const groups = [...new Set(items.map((i) => i.group))];
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"))
    && !(href === "/trades" && pathname === "/trades/new");

  async function logout() {
    await apiSend("POST", "/api/auth/logout").catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <MeProvider me={me}>
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-700">Product A</div>
            <div className="text-sm font-bold text-slate-900">Chợ thủy sản Sakura</div>
          </div>
          <nav className="space-y-4 p-3">
            {groups.map((g) => (
              <div key={g || "home"}>
                {g && <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g}</div>}
                {items.filter((i) => i.group === g).map((i) => (
                  <Link key={i.href} href={i.href}
                    className={`block rounded-md px-2 py-1.5 text-sm ${active(i.href) ? "bg-sky-50 font-semibold text-sky-800" : "text-slate-700 hover:bg-slate-100"}`}>
                    {i.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
            <select aria-label="Chuyển màn hình" className="rounded-md border border-slate-300 px-2 py-1 text-sm md:hidden"
              value={items.find((i) => active(i.href))?.href ?? "/"} onChange={(e) => router.push(e.target.value)}>
              {items.map((i) => <option key={i.href} value={i.href}>{i.label}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="text-right leading-tight">
                <span className="block font-medium text-slate-900">{me.fullName}</span>
                <span className="block text-xs text-slate-500">{me.roleName}</span>
              </span>
              <button onClick={logout} className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-700 hover:bg-slate-50">
                Đăng xuất
              </button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </MeProvider>
  );
}
