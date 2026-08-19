import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { deleteStorageObjectFromUrl } from "@/lib/storageCleanup";

export async function PATCH(req, { params }) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const limited = rateLimit(`books-edit:${user.id}`, { limit: 60, windowMs: 60 * 1000 });
  if (!limited.ok) {
    return Response.json({ error: "너무 여러 번 시도했어요. 잠시 후 다시 해주세요." }, { status: 429 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "책 정보를 찾을 수 없어요." }, { status: 400 });
  }

  const { title, author } = await req.json();
  if (!title || !title.trim()) {
    return Response.json({ error: "제목은 비워둘 수 없어요." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: book, error } = await supabase
    .from("books")
    .update({ title: title.trim(), author: author?.trim() || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return Response.json({ error: "책 정보를 수정하는 중 문제가 생겼어요." }, { status: 500 });
  }
  return Response.json({ book });
}

export async function DELETE(req, { params }) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const limited = rateLimit(`books-delete:${user.id}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limited.ok) {
    return Response.json({ error: "너무 여러 번 시도했어요. 잠시 후 다시 해주세요." }, { status: 429 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "책 정보를 찾을 수 없어요." }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Grab image URLs before the cascade delete removes the rows that
  // reference them — Storage objects don't clean themselves up.
  const [{ data: book }, { data: records }] = await Promise.all([
    supabase.from("books").select("cover_image_url").eq("id", id).maybeSingle(),
    supabase.from("records").select("image_url").eq("book_id", id),
  ]);

  // reading_sessions / records / weekly_curation_books all reference
  // books(id) with ON DELETE CASCADE (see supabase/schema.sql), so this
  // single delete also removes the book's sessions, records, and its
  // link to any weekly curation.
  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) {
    console.error(error);
    return Response.json({ error: "책을 삭제하는 중 문제가 생겼어요." }, { status: 500 });
  }

  const imageUrls = [book?.cover_image_url, ...(records || []).map((r) => r.image_url)].filter(Boolean);
  await Promise.all(imageUrls.map((url) => deleteStorageObjectFromUrl(supabase, url)));

  return Response.json({ ok: true });
}
