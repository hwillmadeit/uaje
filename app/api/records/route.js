import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const limited = rateLimit(`records-add:${user.id}`, { limit: 60, windowMs: 60 * 1000 });
  if (!limited.ok) {
    return Response.json({ error: "너무 여러 번 시도했어요. 잠시 후 다시 해주세요." }, { status: 429 });
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
