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
            justifyContent: "flex-start",
            gap: "1.5%",
          }}
        >
          {rowBooks[i].map((b) => (
            <div key={b.id} style={{ flex: `0 0 ${row.bookWidthPct}%` }}>
              <BookItem book={b} openBook={openBook} isNew={newIds.has(b.id)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
