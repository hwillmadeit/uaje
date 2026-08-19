import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";

export async function POST(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { bookId, sessionId, type, content, imageUrl } = await req.json();
  if (!bookId || !type) {
    return Response.json({ error: "필수 정보가 없어요." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: record, error } = await supabase
    .from("records")
    .insert({ book_id: bookId, reading_session_id: sessionId || null, type, content: content || null, image_url: imageUrl || null })
    .select()
    .single();

  if (error) {
    console.error(error);
    return Response.json({ error: "기록을 저장하는 중 문제가 생겼어요." }, { status: 500 });
  }
  return Response.json({ record });
}
