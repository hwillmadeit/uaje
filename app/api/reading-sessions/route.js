import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";

export async function POST(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { bookId, date } = await req.json();
  if (!bookId) return Response.json({ error: "책 정보가 없어요." }, { status: 400 });

  const readDate = date || new Date().toISOString().slice(0, 10);
  const supabase = supabaseServer();

  const { data: existing, error: existErr } = await supabase.from("reading_sessions").select("id, read_date").eq("book_id", bookId);
  if (existErr) {
    console.error(existErr);
    return Response.json({ error: "읽은 날을 추가하는 중 문제가 생겼어요." }, { status: 500 });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("reading_sessions")
    .insert({ book_id: bookId, read_date: readDate, read_number: (existing?.length || 0) + 1 })
    .select()
    .single();
  if (insertErr) {
    console.error(insertErr);
    return Response.json({ error: "읽은 날을 추가하는 중 문제가 생겼어요." }, { status: 500 });
  }

  // A date picked in the past can land before an existing session — renumber
  // everything by actual read_date so "첫 번째 읽음" / "N번째 읽음" stays
  // chronologically correct instead of just "order added".
  const all = [...(existing || []), { id: inserted.id, read_date: readDate }].sort((a, b) => (a.read_date < b.read_date ? -1 : a.read_date > b.read_date ? 1 : a.id - b.id));

  await Promise.all(all.map((s, i) => supabase.from("reading_sessions").update({ read_number: i + 1 }).eq("id", s.id)));

  const { data: sessions, error: refetchErr } = await supabase.from("reading_sessions").select("*").eq("book_id", bookId).order("read_number");
  if (refetchErr) {
    console.error(refetchErr);
    return Response.json({ error: "읽은 날을 추가하는 중 문제가 생겼어요." }, { status: 500 });
  }

  return Response.json({ sessions });
}
