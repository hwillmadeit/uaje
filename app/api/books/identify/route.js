import { getRouteUser } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — plenty for a phone photo, cheap to reject bigger

const VISION_PROMPT = `이 사진에는 어린이책 여러 권이 나란히 놓여 있습니다.
사진 속에서 구분되는 책 표지 영역을 각각 찾아, 각 표지에서 읽을 수 있는
책 제목과(가능하다면) 저자를 추출해주세요.

다른 설명 없이 아래 JSON 배열 형식으로만 답하세요:
[{"cropLabel":"표지 영역 1","detectedTitle":"...","detectedAuthor":"..." 또는 null}, ...]

제목을 알아볼 수 없는 표지는 detectedTitle을 null로 주세요.
책이 아닌 것은 결과에 포함하지 마세요.`;

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req) {
  // Vision calls cost money per request, so this route is gated behind
  // both auth and a rate limit — not just auth alone.
  const user = await getRouteUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const limited = rateLimit(`identify:${user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return Response.json({ error: "너무 여러 번 시도했어요. 잠시 후 다시 해주세요." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_VISION_MODEL;

  if (!apiKey || !model) {
    // Honest fallback — never invent a "recognized" result when vision
    // isn't actually configured. See .env.local.example for setup.
    return Response.json({
      notConfigured: true,
      message: "책 인식 기능이 아직 연결되지 않았어요. 제목으로 찾거나 직접 입력해주세요.",
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

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: VISION_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Vision API error:", errText);
      return Response.json({ error: "책을 찾는 중 문제가 생겼어요." }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.content || []).map((b) => b.text || "").join("");
    const raw = extractJson(text);

    const detections = raw.map((d, i) => ({
      slotId: `d${i + 1}`,
      cropLabel: d.cropLabel || `표지 영역 ${i + 1}`,
      detectedTitle: d.detectedTitle || null,
      detectedAuthor: d.detectedAuthor || null,
    }));

    return Response.json({ detections });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "책을 찾는 중 문제가 생겼어요." }, { status: 500 });
  }
}
