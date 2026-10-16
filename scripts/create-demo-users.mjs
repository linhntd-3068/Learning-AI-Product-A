// Create (or refresh) one demo account per role in Supabase Auth + profiles, then add one pending correction
// so the approver has something to review. Safe to run again.
// Usage: node --env-file=.env.local scripts/create-demo-users.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env.local");
  process.exit(1);
}
const PASSWORD = process.env.DEMO_PASSWORD ?? "Sakura-Demo-2026";
const USERS = [
  ["demo.admin@example.com", "Quản trị hệ thống (demo)", "sys_admin"],
  ["demo.ops@example.com", "Vận hành chợ (demo)", "market_ops"],
  ["demo.intake@example.com", "Tiếp nhận lô (demo)", "intake"],
  ["demo.judge@example.com", "Đánh giá hàng (demo)", "judge"],
  ["demo.trade@example.com", "Giao dịch (demo)", "trade"],
  ["demo.delivery@example.com", "Giao hàng (demo)", "delivery"],
  ["demo.settlement@example.com", "Đối soát (demo)", "settlement"],
  ["demo.approver@example.com", "Phê duyệt (demo)", "approver"],
];

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: list, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
const ids = {};
for (const [email, fullName, role] of USERS) {
  let user = list.users.find((u) => u.email === email);
  if (user) {
    const { error } = await db.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
    if (error) throw error;
  } else {
    const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await db.from("profiles").upsert({ id: user.id, email, full_name: fullName, role, active: true });
  if (error) throw error;
  ids[role] = user.id;
  console.log(`ok  ${role.padEnd(11)} ${email}`);
}

// One pending correction on yesterday's locked day, requested by the settlement user.
const { count } = await db.from("corrections").select("id", { count: "exact", head: true });
if (!count) {
  const { data: trade } = await db.from("trades").select("id, code, qty, unit_price, business_day")
    .eq("status", "confirmed").eq("kind", "negotiated").gt("qty", 0).order("business_day").order("id").limit(1).maybeSingle();
  if (trade) {
    const { error } = await db.from("corrections").insert({
      trade_id: trade.id, new_qty: trade.qty, new_unit_price: Number(trade.unit_price) - 100,
      reason: "Bên bán xác nhận lại đơn giá thấp hơn 100 yên/đơn vị (dữ liệu demo)", requested_by: ids.settlement,
    });
    if (error) throw error;
    console.log(`ok  pending correction for ${trade.code}`);
  }
}
console.log(`\nĐã xong. Mật khẩu chung của tài khoản demo: xem README.md (hoặc biến DEMO_PASSWORD).`);
