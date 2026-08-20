"use client";

import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/Primitives";
import { BookShelf } from "@/components/books/BookShelf";
import { useLibrary } from "@/lib/LibraryContext";

export default function ShelfScreen({ openBook, onAddBook }) {
  const { books, newIds } = useLibrary();
  const [activeTag, setActiveTag] = useState(null);

  const allTags = useMemo(() => {
    const set = new Set();
    books.forEach((b) => (b.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [books]);

  const shownBooks = activeTag ? books.filter((b) => (b.tags || []).includes(activeTag)) : books;

  return (
    <div>
      <AppHeader title="나의 서재" sub="내가 읽은 책들이 책장에 차곡차곡" />

      {allTags.length > 0 && (
        <div className="uaje-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 22px 16px" }}>
          <button
            onClick={() => setActiveTag(null)}
            className="uaje-tap"
            style={{
              flexShrink: 0,
              fontSize: 11.5,
              padding: "6px 13px",
              borderRadius: 20,
              border: `1px solid ${!activeTag ? "var(--terracotta)" : "var(--border)"}`,
              background: !activeTag ? "var(--terracotta)" : "var(--surface)",
              color: !activeTag ? "#FBF8F0" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            전체
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? null : t)}
              className="uaje-tap"
              style={{
                flexShrink: 0,
                fontSize: 11.5,
                padding: "6px 13px",
                borderRadius: 20,
                border: `1px solid ${activeTag === t ? "var(--terracotta)" : "var(--border)"}`,
                background: activeTag === t ? "var(--terracotta)" : "var(--surface)",
                color: activeTag === t ? "#FBF8F0" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "4px 22px 36px" }}>
        {activeTag && shownBooks.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-muted)", padding: "30px 0" }}>&ldquo;{activeTag}&rdquo; 태그가 붙은 책이 아직 없어요.</div>
        ) : (
          <BookShelf books={shownBooks} openBook={openBook} newIds={newIds} />
        )}
        <button
          onClick={onAddBook}
          className="uaje-tap"
          style={{ marginTop: 22, width: "100%", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-lg)", padding: "18px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: 12.5, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Plus size={15} /> 책 추가
        </button>
      </div>
    </div>
  );
}
