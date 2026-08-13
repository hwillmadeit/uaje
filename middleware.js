import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Runs on every matched request (see config.matcher below).
// 1. Refreshes the Supabase session cookie so it doesn't silently expire.
// 2. Redirects signed-out visitors to /login for every page except the
//    login page itself and the auth callback route.
//
// API routes are intentionally excluded from the matcher — they enforce
// their own auth check (getRouteUser in lib/supabaseServer.js) and return a
// proper 401 JSON response instead of an HTML redirect.
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/auth/callback");

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
