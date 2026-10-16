"use client";
import { useState, type FormEvent } from "react";
import { apiSend } from "@/lib/client/api-client";

// Sign-in screen (SCR-001). On success go to the page the user first asked for, or the home screen.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiSend("POST", "/api/auth/login", { email, password });
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-700">Product A · Prototype LAB-2</div>
          <h1 className="mt-1 text-lg font-bold text-slate-900">Hệ thống hỗ trợ nghiệp vụ chợ thủy sản Sakura</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập bằng tài khoản được cấp. Tài khoản demo xem trong README.</p>
        </div>
        {error && <p role="alert" className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </label>
        <label className="mb-5 block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mật khẩu</span>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        </label>
        <button type="submit" disabled={busy} className="w-full rounded-md bg-sky-700 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60">
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
