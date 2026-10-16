"use client";
import { useCallback, useEffect, useState } from "react";

// Calls to our own Next.js API routes. A 401 sends the user back to the login page.
async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Full reload on purpose: the session cookie is gone and every cached client state must be dropped.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
    throw new Error("Phiên đăng nhập đã hết hạn");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Lỗi ${res.status}`);
  return body as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  return handle<T>(await fetch(url, { cache: "no-store" }));
}

export async function apiSend<T>(method: "POST" | "PATCH" | "PUT" | "DELETE", url: string, body?: unknown): Promise<T> {
  return handle<T>(await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
}

// Load JSON from an API route; `reload` refetches after a write. `url = null` waits (e.g. no day picked yet).
// State only changes in the fetch callbacks; "loading" is derived (the last result is for an older request),
// and the previous data stays on screen while the next request runs.
export function useApi<T>(url: string | null) {
  const [tick, setTick] = useState(0);
  const key = url ? `${url}#${tick}` : null;
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });

  useEffect(() => {
    if (!url || !key) return;
    let alive = true;
    apiGet<T>(url)
      .then((d) => { if (alive) setState({ key, data: d, error: null }); })
      .catch((e: Error) => { if (alive) setState((s) => ({ key, data: s.data, error: e.message })); });
    return () => { alive = false; };
  }, [url, key]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data: state.data, error: state.error, loading: key !== null && state.key !== key, reload };
}
