import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";

export async function POST(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "추가할 책이 없어요." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const newBooks = [];
  const newSessions = [];
  const linkedExistingIds = [];

  try {
    for (const item of items) {
      if (item.status === "found") {
        const { data: book, error: bookErr } = await supabase
          .from("books")
          .insert({
            title: item.title,
            author: item.author || null,
            publisher: item.publisher || null,
            cover_image_url: item.coverImageUrl || null,
            color: item.color || null,
          })
          .select()
          .single();
        if (bookErr) throw bookErr;
        newBooks.push(book);
      } else if (item.status === "duplicate" && item.existingBookId) {
        const { count } = await supabase
          .from("reading_sessions")
          .select("*", { count: "exact", head: true })
          .eq("book_id", item.existingBookId);
        const { data: session, error: sessErr } = await supabase
          .from("reading_sessions")
          .insert({ book_id: item.existingBookId, read_date: new Date().toISOString().slice(0, 10), read_number: (count || 0) + 1 })
          .select()
          .single();
        if (sessErr) throw sessErr;
        newSessions.push(session);
        linkedExistingIds.push(item.existingBookId);
      }
    }

    // Link everything into the current (most recent) weekly curation.
    const { data: curation } = await supabase.from("weekly_curations").select("id").order("week_start", { ascending: false }).limit(1).single();
    const allBookIds = [...newBooks.map((b) => b.id), ...linkedExistingIds];
    if (curation && allBookIds.length > 0) {
      const { data: existingLinks } = await supabase.from("weekly_curation_books").select("book_id, order").eq("curation_id", curation.id);
      const startOrder = existingLinks?.length || 0;
      const already = new Set((existingLinks || []).map((l) => l.book_id));
      const rows = allBookIds
        .filter((id) => !already.has(id))
        .map((bookId, i) => ({ curation_id: curation.id, book_id: bookId, order: startOrder + i }));
      if (rows.length > 0) {
        await supabase.from("weekly_curation_books").insert(rows);
      }
    }

    return Response.json({ newBooks, newSessions, linkedExistingIds });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "책을 등록하는 중 문제가 생겼어요." }, { status: 500 });
  }
}
