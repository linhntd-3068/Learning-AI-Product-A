// Shapes returned by the API routes, shared by the screens.

export type Participant = {
  id: number; code: string; name: string; kind: string; basis: string; status: string;
  valid_from: string; valid_to: string; phone: string | null; note: string | null; updated_at: string;
};

export type Lot = {
  id: number; code: string; business_day: string; shipper: string; item: string; unit: string;
  initial_qty: number; available_qty: number; grade: string | null; inspection_note: string | null;
  inspected_at: string | null; status: string; created_at: string;
  seller: { code: string; name: string } | null;
};

export type Trade = {
  id: number; code: string; business_day: string; kind: string; entry_type: string; status: string;
  qty: number; unit_price: number; amount: number; confirmed_at: string; note: string | null;
  lot: { code: string; item: string; unit: string } | null;
  buyer: { code: string; name: string } | null;
  seller: { code: string; name: string } | null;
};

export type DeliveryRow = Trade & { delivered: number; remaining: number; exceptions: number; state: string };
