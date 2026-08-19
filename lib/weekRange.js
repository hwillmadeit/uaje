// "이번 주" should mean the calendar week containing today — not just
// "whichever weekly_curations row happens to have the latest week_start".
// Both the read path (LibraryContext) and the write path (/api/books/add)
// use this so they always agree on what "this week" means.

export function currentWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toISODate = (x) => x.toISOString().slice(0, 10);
  return { weekStart: toISODate(monday), weekEnd: toISODate(sunday) };
}
