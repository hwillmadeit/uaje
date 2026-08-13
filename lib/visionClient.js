// Shared by /api/books/identify (multi-book) and /api/books/cover
// (single-cover title + crop box) — both just need "send an image + a
// prompt, get JSON back".

export function extractJson(text) {
  let cleaned = text.replace(/```json|```/g, "").trim();

  // The model is instructed to answer with *only* JSON, but sometimes adds
  // a short sentence around it anyway ("Here's the result: {...}"). Pull
  // out just the JSON substring instead of failing the whole request over
  // a stray sentence.
  const openers = ["{", "["].map((ch) => cleaned.indexOf(ch)).filter((i) => i !== -1);
  if (openers.length > 0) {
    const start = Math.min(...openers);
    if (start > 0) cleaned = cleaned.slice(start);
  }
  const closers = [cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]")].filter((i) => i !== -1);
  if (closers.length > 0) {
    const end = Math.max(...closers);
    if (end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);
  }

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
