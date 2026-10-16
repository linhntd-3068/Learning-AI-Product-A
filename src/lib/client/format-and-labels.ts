// Number / date formatting and Vietnamese labels for the codes stored in the database.

export const fmtNum = (v: number | string | null | undefined, digits = 2) =>
  v === null || v === undefined ? "—" : Number(v).toLocaleString("vi-VN", { maximumFractionDigits: digits });

export const fmtYen = (v: number | string | null | undefined) =>
  v === null || v === undefined ? "—" : "¥" + Math.round(Number(v)).toLocaleString("en-US");

export const fmtDate = (v: string | null | undefined) => {
  if (!v) return "—";
  const [y, m, d] = v.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export const fmtDateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";

export const PARTICIPANT_KIND: Record<string, string> = {
  wholesaler: "Nhà phân phối lớn", middleman: "Môi giới có giấy phép", buyer: "Khách mua lớn", retail_buyer: "Người đi chợ",
};
export const BASIS: Record<string, string> = { registration: "Đăng ký", license: "Giấy phép", approval: "Chấp thuận" };
export const PARTICIPANT_STATUS: Record<string, string> = {
  active: "Hiệu lực", suspended: "Tạm dừng", expired: "Hết hiệu lực", under_review: "Tái thẩm định",
};
export const LOT_STATUS: Record<string, string> = {
  received: "Đã tiếp nhận", inspected: "Đã đánh giá", on_sale: "Đang bán", sold_out: "Đã bán hết",
};
export const TRADE_KIND: Record<string, string> = { negotiated: "Thỏa thuận", auction: "Đấu giá" };
export const ENTRY_TYPE: Record<string, string> = { original: "Gốc", reversal: "Bút toán đảo", adjusted: "Bút toán điều chỉnh" };
export const TRADE_STATUS: Record<string, string> = { confirmed: "Đã chốt", cancelled: "Đã hủy", reversed: "Đã điều chỉnh" };
export const DELIVERY_STATE: Record<string, string> = {
  waiting: "Chờ giao", partial: "Đang giao", done: "Hoàn tất", exception: "Có ngoại lệ",
};
export const EXCEPTION_TYPE: Record<string, string> = {
  short: "Giao thiếu", over: "Giao thừa", return: "Trả hàng", partial_cancel: "Hủy một phần",
};
export const CORRECTION_STATUS: Record<string, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
export const DAY_STATUS: Record<string, string> = { open: "Đang mở", locked: "Đã khóa sổ" };
export const AUDIT_ACTION: Record<string, string> = {
  login: "Đăng nhập", create: "Tạo", update: "Sửa", inspect: "Ghi đánh giá", confirm: "Chốt giao dịch",
  record_auction: "Ghi kết quả đấu giá", cancel: "Hủy", deliver: "Ghi giao hàng", delivery_exception: "Ghi ngoại lệ",
  lock_day: "Khóa ngày", request_correction: "Yêu cầu điều chỉnh", approve_correction: "Duyệt điều chỉnh",
  reject_correction: "Từ chối điều chỉnh", export_csv: "Xuất CSV", create_user: "Tạo tài khoản",
  update_user: "Sửa tài khoản", grant: "Cấp quyền", revoke: "Thu hồi quyền",
};

// Badge colour for a status code.
export function tone(code: string): "green" | "amber" | "red" | "slate" | "blue" {
  if (["active", "confirmed", "done", "approved", "open", "sold_out"].includes(code)) return "green";
  if (["pending", "partial", "inspected", "under_review", "waiting", "on_sale"].includes(code)) return "amber";
  if (["expired", "suspended", "cancelled", "rejected", "exception", "reversed"].includes(code)) return "red";
  if (["locked"].includes(code)) return "blue";
  return "slate";
}
