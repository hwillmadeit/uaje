"use client";

import React from "react";
import { Palette } from "lucide-react";
import { AppHeader, SectionLabel, Serif, BookCover } from "@/components/layout/Primitives";
import { useLibrary } from "@/lib/LibraryContext";

export default function Archive() {
  const { books, sessionsOf, recordsOf } = useLibrary();

  const allRecords = books.flatMap((b) => recordsOf(b.id));
  const drawings = allRecords.filter((r) => r.type === "drawing");
  const quotes = allRecords.filter((r) => r.type === "quote" || r.type === "thought");
  const actions = allRecords.filter((r) => r.type === "action" || r.type === "photo");
  const learned = allRecords.filter((r) => r.type === "learned");
  const readBooks = books.filter((b) => sessionsOf(b.id).length > 0);
  const rereadBook = books.find((b) => sessionsOf(b.id).length > 1) || null;
  const favoriteBook = readBooks[0] || null;

  return (
    <div>
      <AppHeader title="나의 아카이브" sub="한 해의 책과 생각을 모은 작은 책" />
      <div style={{ padding: "0 22px 36px" }}>
        <div style={{ background: "linear-gradient(160deg, var(--surface-deep), var(--surface-soft))", border: "1px solid var(--border)", borderRadius: "var(--radius-section)", padding: "28px 22px", textAlign: "center", marginBottom: 28, boxShadow: "var(--shadow-soft)" }}>
          <Serif as="div" style={{ fontSize: 23, fontWeight: 700, color: "var(--text-primary)" }}>
            나의 서재
          </Serif>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5 }}>My Reading Archive</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 20 }}>
            {[
              ["읽은 책", readBooks.length],
              ["남긴 그림", drawings.length],
              ["다시 읽은 책", rereadBook ? 1 : 0],
            ].map(([label, n]) => (
              <div key={label}>
                <div style={{ fontSize: 18, color: "var(--terracotta)", fontFamily: "var(--serif)", fontWeight: 700 }}>{n}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <SectionLabel label="내가 읽은 책" />
        <div className="uaje-scroll" style={{ display: "flex", gap: 11, overflowX: "auto", paddingBottom: 6, marginBottom: 26 }}>
          {readBooks.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>아직 읽은 책이 없어요.</div>}
          {readBooks.map((b) => (
            <BookCover key={b.id} book={b} width={64} height={88} />
          ))}
        </div>

        {favoriteBook && (
          <>
            <SectionLabel label="내가 좋아했던 책" />
            <div style={{ display: "flex", gap: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 18, marginBottom: 26, alignItems: "center", boxShadow: "var(--shadow-soft)" }}>
              <BookCover book={favoriteBook} width={60} height={82} />
              <div>
                <Serif as="div" style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                  {favoriteBook.title}
                </Serif>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5, lineHeight: 1.6 }}>오래 붙잡고 이야기 나눈 책이에요.</div>
              </div>
            </div>
          </>
        )}

        {rereadBook && (
          <>
            <SectionLabel label="내가 다시 읽은 책" />
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 26 }}>
              <BookCover book={rereadBook} width={56} height={76} />
              <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                {rereadBook.title}
                <div style={{ fontSize: 11, color: "var(--dusty-blue)", marginTop: 3 }}>{sessionsOf(rereadBook.id).length}번 읽었어요</div>
              </div>
            </div>
          </>
        )}

        {drawings.length > 0 && (
          <>
            <SectionLabel label="내가 남긴 그림" />
            <div className="uaje-record-grid" style={{ marginBottom: 26 }}>
              {drawings.map((r) => {
                const book = books.find((b) => b.id === r.bookId);
                if (!book) return null;
                return (
                  <div key={r.id} style={{ aspectRatio: "1", borderRadius: "var(--radius-md)", background: `${book.color || "#B9A184"}26`, border: `1px solid ${book.color || "#B9A184"}44`, display: "flex", alignItems: "center", justifyContent: "center", color: book.color || "#B9A184" }}>
                    <Palette size={18} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {quotes.length > 0 && (
          <>
            <SectionLabel label="내가 했던 이야기" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 26 }}>
              {quotes.slice(0, 4).map((r) => (
                <Serif key={r.id} as="div" style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.7 }}>
                  “{r.content}”
                </Serif>
              ))}
            </div>
          </>
        )}

        {actions.length > 0 && (
          <>
            <SectionLabel label="책을 읽고 해본 것" />
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
              {actions.slice(0, 4).map((r) => (
                <div key={r.id} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  · {r.content}
                </div>
              ))}
            </div>
          </>
        )}

        {learned.length > 0 && (
          <>
            <SectionLabel label="올해 내가 알게 된 것" />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {learned.map((r) => (
                <div key={r.id} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  💡 {r.content}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
