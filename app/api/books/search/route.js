import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const limited = rateLimit(`search:${user.id}`, { limit: 60, windowMs: 60 * 1000 });
  if (!limited.ok) {
    return Response.json({ error: "검색이 너무 잦아요. 잠시 후 다시 해주세요." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return Response.json([]);

  const supabase = supabaseServer();

  // 1) Our own library first — this is how duplicates get caught.
  const { data: libraryRows, error: libErr } = await supabase.from("books").select("id, title, author, cover_image_url, color").ilike("title", `%${q}%`).limit(5);
  if (libErr) {
    console.error(libErr);
    return Response.json({ error: "검색 중 문제가 생겼어요." }, { status: 500 });
  }
  const libraryMatches = (libraryRows || []).map((b) => ({
    source: "library",
    existingBookId: b.id,
    title: b.title,
    author: b.author,
    color: b.color,
    coverImageUrl: b.cover_image_url,
  }));

  // 2) External catalog — Google Books works keyless at low volume.
  let catalogMatches = [];
  try {
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", `intitle:${q}`);
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("langRestrict", "ko");
    if (key) url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      catalogMatches = (data.items || []).map((item) => {
        const info = item.volumeInfo || {};
        return {
          source: "catalog",
          catalogId: item.id,
          title: info.title,
          author: (info.authors || []).join(", ") || null,
          publisher: info.publisher || null,
          coverImageUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") || null,
        };
      });
    } else {
      console.error("Google Books search failed:", res.status);
    }
  } catch (e) {
    console.error("Google Books search error:", e);
    // Catalog search failing shouldn't break the whole response — library
    // matches (if any) are still useful, and the UI handles an empty result.
  }

  return Response.json([...libraryMatches, ...catalogMatches]);
}
