import { searchBook } from "./bookAdapters";

// Never trust the vision model's guess as final — every detected title is
// re-verified against /api/books/search (which checks the household's own
// library first, then the external catalog) before it's shown to the user.
export async function resolveDetections(detections) {
  const resolved = [];
  for (const d of detections) {
    if (!d.detectedTitle) {
      resolved.push({ slotId: d.slotId, status: "not_found", confirmed: false, title: null, author: null, color: null });
      continue;
    }
    const matches = await searchBook(d.detectedTitle);
    const best = matches[0];
    if (!best) {
      resolved.push({ slotId: d.slotId, status: "not_found", confirmed: false, title: d.detectedTitle, author: null, color: null });
    } else if (best.source === "library") {
      resolved.push({
        slotId: d.slotId,
        status: "duplicate",
        confirmed: true,
        title: best.title,
        author: best.author,
        color: best.color,
        coverImageUrl: best.coverImageUrl,
        existingBookId: best.existingBookId,
      });
    } else {
      resolved.push({
        slotId: d.slotId,
        status: "found",
        confirmed: true,
        title: best.title,
        author: best.author,
        color: best.color,
        coverImageUrl: best.coverImageUrl,
        publisher: best.publisher,
      });
    }
  }
  return resolved;
}
