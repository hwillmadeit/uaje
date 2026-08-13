import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";

export async function POST(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { bookId } = await req.json();
  if (!bookId) return Response.json({ error: "책 정보가 없어요." }, { status: 400 });

  const supabase = supabaseServer();
  const { count } = await supabase.from("reading_sessions").select("*", { count: "exact", head: true }).eq("book_id", bookId);

  const { data: session, error } = await supabase
    .from("reading_sessions")
    .insert({ book_id: bookId, read_date: new Date().toISOString().slice(0, 10), read_number: (count || 0) + 1 })
    .select()
    .single();

  if (error) {
    console.error(error);
    return Response.json({ error: "읽은 날을 추가하는 중 문제가 생겼어요." }, { status: 500 });
  }
  return Response.json({ session });
}
