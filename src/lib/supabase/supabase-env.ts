// Supabase settings read from environment variables, with a clear message when one is missing.
// Accepts both the new key names (publishable / secret) and the legacy ones (anon / service_role).

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}. Xem .env.example và README.md.`);
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabasePublishableKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseSecretKey(): string {
  return required(
    "SUPABASE_SECRET_KEY",
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
