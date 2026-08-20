"use client";

import React from "react";
import { BookItem } from "@/components/books/BookShelf";

// Geometry below was measured from the actual image (public/images/bookshelf-frame.png,
// 1100×1430px) by sampling pixel brightness to find the shelf-board edges and
// case frame — not eyeballed. All values are percentages of the wrapper,
// which is pinned to the image's exact aspect ratio (see aspectRatio below),
// so they stay correct at any responsive width.
//
// Rows 1 and 3 stop short of the right edge on purpose — the source image
// already has a few decorative books/a small box drawn into those corners,
// so real books are kept clear of that area. Row 2 is fully open in the
// image and uses the full interior width.
const IMAGE_ASPECT = 1100 / 1430;

const ROWS = [
  { top: 18.5, height: 24.5, left: 7.7, width: 67.3, bookWidthPct: 18.3, maxCount: 5 },
  { top: 46.2, height: 21.3, left: 7.7, width: 86.4, bookWidthPct: 12.4, maxCount: 6 },
  { top: 72.7, height: 24.2, left: 7.7, width: 67.3, bookWidthPct: 18.0, maxCount: 5 },
];

export const PHOTO_SHELF_CAPACITY = ROWS.reduce((sum, r) => sum + r.maxCount, 0);

// "이번 주 책" holds up to 5 books, shown as a 2-tier shelf — 3 on top,
// 2 below, both centered — cropped from the same image down to just the
// first two compartments. The crop point (72.7%) lands right at the
// bottom edge of the second shelf board, so it reads as a clean, finished
// bottom edge rather than a photo cut off mid-cabinet.
const WEEKLY_CROP_FRACTION = 0.727;
const WEEKLY_ASPECT = 1100 / (1430 * WEEKLY_CROP_FRACTION);
const rescale = (row) => ({
  top: (row.top / (WEEKLY_CROP_FRACTION * 100)) * 100,
  height: (row.height / (WEEKLY_CROP_FRACTION * 100)) * 100,
  left: row.left,
  width: row.width,
  bookWidthPct: row.bookWidthPct,
});
const WEEKLY_ROWS = [
  { ...rescale(ROWS[0]), maxCount: 3 },
  { ...rescale(ROWS[1]), maxCount: 2 },
];

export function PhotoWeeklyShelf({ books, openBook, newIds }) {
  let cursor = 0;
  const rowBooks = WEEKLY_ROWS.map((row) => {
    const slice = books.slice(cursor, cursor + row.maxCount);
    cursor += row.maxCount;
    return slice;
  });

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: WEEKLY_ASPECT, borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-soft)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/bookshelf-frame.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "auto", display: "block" }} />

      {books.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: `${WEEKLY_ROWS[0].top}%`,
            left: `${WEEKLY_ROWS[0].left}%`,
            width: `${WEEKLY_ROWS[0].width}%`,
            height: `${WEEKLY_ROWS[0].height}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            padding: "0 8%",
          }}
        >
          이번 주에 등록된 책이 아직 없어요.
        </div>
      )}

      {WEEKLY_ROWS.map((row, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${row.top}%`,
            left: `${row.left}%`,
            width: `${row.width}%`,
            height: `${row.height}%`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "1.8%",
          }}
        >
          {rowBooks[i].map((b) => (
            <div key={b.id} style={{ flex: `0 0 ${row.bookWidthPct}%` }}>
              <BookItem book={b} openBook={openBook} isNew={newIds.has(b.id)} fit="contain" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PhotoBookShelf({ books, openBook, newIds }) {
  let cursor = 0;
  const rowBooks = ROWS.map((row) => {
    const slice = books.slice(cursor, cursor + row.maxCount);
    cursor += row.maxCount;
    return slice;
  });

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: IMAGE_ASPECT, borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-soft)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/bookshelf-frame.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" }} />

      {books.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: `${ROWS[1].top}%`,
            left: `${ROWS[1].left}%`,
            width: `${ROWS[1].width}%`,
            height: `${ROWS[1].height}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontSize: 12.5,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            padding: "0 8%",
          }}
        >
          아직 비어 있는 책장이에요.
          <br />첫 번째 책을 꽂아볼까요?
        </div>
      )}

      {ROWS.map((row, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${row.top}%`,
            left: `${row.left}%`,
            width: `${row.width}%`,
            height: `${row.height}%`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "1.8%",
          }}
        >
          {rowBooks[i].map((b) => (
            <div key={b.id} style={{ height: "100%", flexShrink: 0 }}>
              <BookItem book={b} openBook={openBook} isNew={newIds.has(b.id)} naturalRatio />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
