// Shared by /api/books/identify (multi-book) and /api/books/cover
// (single-cover title + crop box) — both just need "send an image + a
// prompt, get JSON back".

export function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function callVisionJSON({ apiKey, model, base64, mediaType, prompt, maxTokens = 1024 }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vision API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || "").join("");
  return extractJson(text);
}
