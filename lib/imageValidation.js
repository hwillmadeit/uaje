// The client sends a `type` alongside the file, but that's just a string
// the browser reports — nothing stops a request from claiming
// "image/jpeg" while actually uploading an HTML/SVG payload. Since both
// storage buckets are public (see supabase/storage.sql), anything stored
// with a spoofed Content-Type could be served back and rendered as that
// type to anyone who opens the raw storage URL directly. Sniffing the
// actual file signature (magic bytes) instead of trusting the claimed
// type closes that off — only real, known image formats get accepted.

const SIGNATURES = [
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // "GIF8"
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, extra: { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 } }, // "RIFF"...."WEBP"
];

export function detectImageType(buffer) {
  for (const sig of SIGNATURES) {
    const start = sig.offset || 0;
    const matches = sig.bytes.every((b, i) => buffer[start + i] === b);
    if (!matches) continue;
    if (sig.extra) {
      const extraMatches = sig.extra.bytes.every((b, i) => buffer[sig.extra.offset + i] === b);
      if (!extraMatches) continue;
    }
    return sig.type;
  }
  return null;
}

export const EXT_BY_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};
