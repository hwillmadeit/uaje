import { supabaseServer, getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";

async function searchAladin(q) {
  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) return [];

  try {
    const url = new URL("https://www.aladin.co.kr/ttb/api/ItemSearch.aspx");
    url.searchParams.set("ttbkey", ttbKey);
    url.searchParams.set("Query", q);
    url.searchParams.set("QueryType", "Title"); // 브랜드/시리즈명으로도 걸리도록 Keyword로 바꿔도 됨
    url.searchParams.set("SearchTarget", "Book");
    url.searchParams.set("MaxResults", "5");
    url.searchParams.set("start", "1");
    url.searchParams.set("Cover", "Big");
    url.searchParams.set("output", "js");
    url.searchParams.set("Version", "20131101");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Aladin search failed:", res.status);
      return [];
    }
    const data = await res.json();
    if (data.errorCode) {
      console.error("Aladin search error:", data.errorMessage);
      return [];
    }
    return (data.item || []).map((item) => ({
      source: "catalog",
      catalogId: `aladin-${item.isbn13 || item.itemId}`,
      title: item.title,
      author: item.author || null,
      publisher: item.publisher || null,
      coverImageUrl: item.cover || null,
    }));
  } catch (e) {
    console.error("Aladin search error:", e);
    return [];
  }
}

async function searchGoogleBooks(q) {
  try {
    const key = process.env.GOOGLE_BOOKS_API_KEY;
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", `intitle:${q}`);
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("langRestrict", "ko");
    if (key) url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Google Books search failed:", res.status);
      return [];
    }
    const data = await res.json();
    return (data.items || []).map((item) => {
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
  } catch (e) {
    console.error("Google Books search error:", e);
    return [];
  }
}

// Removes duplicates when both catalogs return the same book (matched by
// normalized title) — keeps whichever came first (Aladin, since it's
// listed first below and has better Korean cover art).
function dedupeByTitle(items) {
  const seen = new Set();
  return items.filter((it) => {
    const key = (it.title || "").replace(/\s/g, "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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

  // 2) External catalogs, in parallel. Aladin first — it covers Korean
  // publishers/brand series (캐릭터·시리즈 도서 등) far better than Google
  // Books, which is mostly strong on internationally-distributed titles.
  // Google Books stays as a free, keyless fallback/supplement.
  const [aladinMatches, googleMatches] = await Promise.all([searchAladin(q), searchGoogleBooks(q)]);
  const catalogMatches = dedupeByTitle([...aladinMatches, ...googleMatches]);

  return Response.json([...libraryMatches, ...catalogMatches]);
}
