import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./supabase-env";

// Supabase client bound to the visitor's auth cookies. Used only for authentication
// (sign-in, sign-out, reading the signed-in user); business data goes through the admin client.
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a context that cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
