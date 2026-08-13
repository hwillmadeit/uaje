"use client";

import React from "react";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/Primitives";
import { BookShelf } from "@/components/books/BookShelf";
import { useLibrary } from "@/lib/LibraryContext";

export default function ShelfScreen({ openBook, onAddBook }) {
  const { books, newIds } = useLibrary();
  return (
    <div>
      <AppHeader title="나의 서재" sub="내가 읽은 책들이 책장에 차곡차곡" />
      <div style={{ padding: "4px 22px 36px" }}>
        <BookShelf books={books} openBook={openBook} newIds={newIds} />
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
