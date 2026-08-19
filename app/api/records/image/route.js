import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const limited = rateLimit(`record-image:${user.id}`, { limit: 60, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return Response.json({ error: "너무 여러 번 시도했어요. 잠시 후 다시 해주세요." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!file) {
    return Response.json({ error: "이미지가 없어요." }, { status: 400 });
  }
  if (typeof file.size === "number" && file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "이미지 용량이 너무 커요." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/png";
  const ext = contentType.split("/")[1] || "png";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = supabaseServer();
  const { error: uploadError } = await supabase.storage.from("record-images").upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (uploadError) {
    console.error(uploadError);
    return Response.json({ error: "이미지를 저장하는 중 문제가 생겼어요." }, { status: 500 });
  }

  const { data } = supabase.storage.from("record-images").getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
