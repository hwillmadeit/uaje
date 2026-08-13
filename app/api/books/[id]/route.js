import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
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

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "책 정보를 찾을 수 없어요." }, { status: 400 });
  }

  const supabase = supabaseServer();
  // reading_sessions / records / weekly_curation_books all reference
  // books(id) with ON DELETE CASCADE (see supabase/schema.sql), so this
  // single delete also removes the book's sessions, records, and its
  // link to any weekly curation.
  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) {
    console.error(error);
    return Response.json({ error: "책을 삭제하는 중 문제가 생겼어요." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
