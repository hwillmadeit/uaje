import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Admin client — service role key, bypasses RLS entirely. Only ever used
// for the actual write after a route has already confirmed (via
// getRouteUser below) that the request comes from a signed-in user.
// Never import this into a "use client" component.
export function supabaseServer() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// Reads the caller's session from cookies (the same cookies the browser
// client set on sign-in) and returns the authenticated user, or null.
// Every write route calls this FIRST and rejects with 401 if it's null —
// the service-role client's power is only ever exercised on behalf of a
// real signed-in user, never an anonymous request.
export async function getRouteUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      // Route handlers only need to *read* the session here; refreshing/
      // writing cookies is handled by middleware.js on every navigation.
      set() {},
      remove() {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
