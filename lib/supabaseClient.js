import { createBrowserClient } from "@supabase/ssr";

// Cookie-aware browser client. Once a user is signed in (see /login), every
// query made with this client automatically carries their session, which is
// what lets RLS's `auth.role() = 'authenticated'` policies allow reads.
// Without a session, reads return nothing — there is no more "public by
// default" data access.
export const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
