import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product A — Hệ thống hỗ trợ nghiệp vụ chợ thủy sản Sakura",
  description: "Prototype LAB-2: tiếp nhận lô, giao dịch thỏa thuận / đấu giá, giao hàng, đối soát, điều chỉnh",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
