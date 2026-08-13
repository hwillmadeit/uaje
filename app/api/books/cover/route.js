import { getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { callVisionJSON } from "@/lib/visionClient";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // Claude's vision API rejects images above ~5MB — the client resizes before upload, this is just a backstop

const COVER_PROMPT = `이 사진에는 책이 한 권 있습니다.

1. 책 제목을 읽어주세요.
2. 저자를 알 수 있다면 함께 읽어주세요.
3. 사진 속에서 책 표지(앞면)의 네 모서리 좌표를 알려주세요 — 왼쪽 위, 오른쪽 위,
   오른쪽 아래, 왼쪽 아래 순서로요. 책이 비스듬히 찍혀 있어도 실제 표지의
   네 모서리를 최대한 정확하게 짚어주세요. 책상, 손, 배경, 여백은 포함하지
   말고 표지 테두리 바로 안쪽으로 잡아주세요. 좌표는 이미지 전체 너비/높이에
   대한 0~1 사이 비율로 주세요 (0,0은 왼쪽 위, 1,1은 오른쪽 아래).

다른 설명 없이 아래 JSON 형식으로만 답하세요:
{"title":"...", "author":"..." 또는 null, "corners": {
  "tl": {"x":0.08,"y":0.06}, "tr": {"x":0.93,"y":0.09},
  "br": {"x":0.90,"y":0.96}, "bl": {"x":0.06,"y":0.90}
}}

책 표지를 찾을 수 없으면 title을 null로, corners는 생략해주세요.`;

function clamp01(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null;
}

const FULL_FRAME_CORNERS = {
  tl: { x: 0, y: 0 },
  tr: { x: 1, y: 0 },
  br: { x: 1, y: 1 },
  bl: { x: 0, y: 1 },
};

// Shoelace formula — used to reject a degenerate quad (near-zero area,
// e.g. the model returned four nearly-identical points) rather than
// producing a sliver crop.
function quadArea(c) {
  const pts = [c.tl, c.tr, c.br, c.bl];
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % 4];
    area += p.x * q.y - q.x * p.y;
  }
  return Math.abs(area) / 2;
}

function normalizeCorners(raw) {
  if (!raw || typeof raw !== "object") return FULL_FRAME_CORNERS;
  const parsed = {};
  for (const key of ["tl", "tr", "br", "bl"]) {
    const pt = raw[key];
    const x = clamp01(pt?.x);
    const y = clamp01(pt?.y);
    if (x === null || y === null) return FULL_FRAME_CORNERS;
    parsed[key] = { x, y };
  }
  if (quadArea(parsed) < 0.02) return FULL_FRAME_CORNERS;
  return parsed;
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
      return Response.json({ error: "사진 용량이 너무 커요. 5MB 이하로 다시 찍어주세요." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const mediaType = file.type || "image/jpeg";

    const raw = await callVisionJSON({ apiKey, model, base64, mediaType, prompt: COVER_PROMPT, maxTokens: 500 });

    return Response.json({
      title: raw.title || null,
      author: raw.author || null,
      corners: normalizeCorners(raw.corners),
    });
  } catch (e) {
    console.error(e);
    if (e instanceof SyntaxError) {
      // Vision call succeeded but its answer wasn't parseable JSON —
      // degrade to "couldn't read this cover" rather than a hard error.
      return Response.json({ title: null, author: null, corners: FULL_FRAME_CORNERS });
    }
    return Response.json({ error: "표지를 읽는 중 문제가 생겼어요." }, { status: 500 });
  }
}
