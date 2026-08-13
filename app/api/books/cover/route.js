import { getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { callVisionJSON } from "@/lib/visionClient";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // Claude's vision API rejects images above ~5MB — the client resizes before upload, this is just a backstop

const COVER_PROMPT = `이 사진에는 책이 한 권 있습니다.

1. 책 제목을 읽어주세요.
2. 저자를 알 수 있다면 함께 읽어주세요.
3. 사진 속에서 책 표지(앞면)가 차지하는 영역을 사각형으로 표시해주세요.
   책상, 손, 배경, 다른 물건은 제외하고 표지 테두리에 최대한 가깝게 잡아주세요.
   좌표는 이미지 전체 너비/높이에 대한 0~1 사이 비율로 주세요
   (0,0은 왼쪽 위, 1,1은 오른쪽 아래).

다른 설명 없이 아래 JSON 형식으로만 답하세요:
{"title":"...", "author":"..." 또는 null, "box":{"xMin":0.1,"yMin":0.08,"xMax":0.9,"yMax":0.95}}

책 표지를 찾을 수 없으면 title을 null로, box는 생략해주세요.`;

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function normalizeBox(box) {
  if (!box || typeof box !== "object") return { xMin: 0, yMin: 0, xMax: 1, yMax: 1 };
  let { xMin, yMin, xMax, yMax } = box;
  xMin = clamp01(Number(xMin) || 0);
  yMin = clamp01(Number(yMin) || 0);
  xMax = clamp01(Number(xMax) || 1);
  yMax = clamp01(Number(yMax) || 1);
  // Guard against a degenerate/invalid box (e.g. model returns xMax < xMin) —
  // fall back to the full frame rather than producing a zero-size crop.
  if (xMax <= xMin || yMax <= yMin) return { xMin: 0, yMin: 0, xMax: 1, yMax: 1 };
  return { xMin, yMin, xMax, yMax };
}

export async function POST(req) {
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const limited = rateLimit(`cover:${user.id}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return Response.json({ error: "너무 여러 번 시도했어요. 잠시 후 다시 해주세요." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_VISION_MODEL;

  if (!apiKey || !model) {
    return Response.json({
      notConfigured: true,
      message: "표지 자동 인식 기능이 아직 연결되지 않았어요. 제목을 직접 입력해주세요.",
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!file) {
      return Response.json({ error: "이미지가 없어요." }, { status: 400 });
    }
    if (typeof file.size === "number" && file.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "사진 용량이 너무 커요. 8MB 이하로 다시 찍어주세요." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const mediaType = file.type || "image/jpeg";

    const raw = await callVisionJSON({ apiKey, model, base64, mediaType, prompt: COVER_PROMPT, maxTokens: 500 });

    return Response.json({
      title: raw.title || null,
      author: raw.author || null,
      box: normalizeBox(raw.box),
    });
  } catch (e) {
    console.error(e);
    if (e instanceof SyntaxError) {
      // The vision call itself worked — we just couldn't parse its answer
      // as JSON (e.g. it wrapped the JSON in a sentence in an unexpected
      // way). That's a "couldn't read this cover" case, not a system
      // failure, so degrade gracefully: use the full photo as the crop and
      // let the person type the title themselves, instead of showing an
      // error for something that isn't really broken.
      return Response.json({ title: null, author: null, box: { xMin: 0, yMin: 0, xMax: 1, yMax: 1 } });
    }
    return Response.json({ error: "표지를 읽는 중 문제가 생겼어요." }, { status: 500 });
  }
}
