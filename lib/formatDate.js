// Postgres returns dates as "2026-08-11" / timestamps as ISO strings.
// The UI displays dates as "2026.08.11" throughout.
export function formatDate(value) {
  if (!value) return "";
  const s = String(value).slice(0, 10);
  return s.replaceAll("-", ".");
}
