"use client";

import React from "react";
import { BookCover, StatusDot } from "@/components/layout/Primitives";
import { useLibrary } from "@/lib/LibraryContext";
import { statusLabel, BOOK_ASPECT, SHELF_PER_ROW } from "@/lib/constants";

export function WeeklyBooks({ books, openBook }) {
  const { sessionsOf, recordsOf } = useLibrary();
  return (
    <div className="uaje-weekly-grid">
      {books.map((b) => (
        <button
          key={b.id}
          onClick={() => openBook(b.id)}
          className="uaje-tap uaje-weekly-item"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}
        >
          <BookCover book={b} width="100%" height={116} />
          <div>
            <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.3, wordBreak: "keep-all" }}>{b.title}</div>
            <div style={{ marginTop: 4 }}>
              <StatusDot status={statusLabel(sessionsOf(b.id), recordsOf(b.id))} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function BookItem({ book, openBook, isNew }) {
  const { sessionsOf } = useLibrary();
  const readCount = sessionsOf(book.id).length;
  const rerun = readCount > 1;
  return (
    <button
      onClick={() => openBook(book.id)}
      className={`uaje-book uaje-tap ${isNew ? "uaje-book-in" : ""}`}
      style={{ background: "none", border: "none", padding: 0, position: "relative", width: "100%", transform: `rotate(${book.rotation ?? 0}deg)` }}
      aria-label={book.title}
    >
      <BookCover book={book} width="100%" aspectRatio={BOOK_ASPECT} showAuthor={false} compact showInitials={false} titleLines={2} />
      {rerun && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: 7,
            transform: "translateX(-50%)",
            background: "rgba(51,43,36,0.55)",
            color: "#FBF8F0",
            fontSize: 9.5,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 8,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
          }}
        >
          {readCount}회
        </span>
      )}
    </button>
  );
}

function WoodPlank() {
  return (
    <div
      style={{
        height: 12,
        background: "linear-gradient(180deg, var(--wood-plank), var(--wood))",
        borderRadius: "0 0 8px 8px",
        boxShadow: "inset 0 2px 3px rgba(0,0,0,0.12), 0 2px 5px rgba(80,60,40,0.08)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "absolute", top: 1, left: 8, right: 8, height: 1, background: "rgba(255,255,255,0.25)" }} />
    </div>
  );
}

function ShelfRow({ books, openBook, newIds, isLast }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : 28 }}>
      <div className="uaje-shelf-grid" style={{ alignItems: "end" }}>
        {books.map((b) => (
          <BookItem key={b.id} book={b} openBook={openBook} isNew={newIds.has(b.id)} />
        ))}
      </div>
      <WoodPlank />
    </div>
  );
}

export function BookShelf({ books, openBook, newIds }) {
  const rows = React.useMemo(() => {
    // Newest first — most-recently-added books show up at the top of the
    // shelf instead of getting buried at the bottom. `id` is an
    // auto-incrementing identity column, so higher id reliably means
    // "added later" with no timestamp/timezone parsing involved. Sorted
    // here (a local copy) rather than in the shared `books` array, since
    // other screens (Archive's "favorite book" pick, etc.) rely on the
    // original ascending order.
    const sorted = [...books].sort((a, b) => b.id - a.id);
    return chunk(sorted, SHELF_PER_ROW);
  }, [books]);

  return (
    <div style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "36px 22px 22px", boxShadow: "var(--shadow-soft)" }}>
      {books.length === 0 ? (
        <div style={{ marginBottom: 0 }}>
          <div style={{ minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            아직 비어 있는 책장이에요.
            <br />첫 번째 책을 꽂아볼까요?
          </div>
          <WoodPlank />
        </div>
      ) : (
        rows.map((row, i) => <ShelfRow key={i} books={row} openBook={openBook} newIds={newIds} isLast={i === rows.length - 1} />)
      )}
    </div>
  );
}
