"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Serif, SectionLabel } from "@/components/layout/Primitives";
import { WeeklyBooks } from "@/components/books/BookShelf";
import { RT } from "@/lib/constants";
import { useLibrary } from "@/lib/LibraryContext";

function RecentRecordStrip({ openBook }) {
  const { books, recordsOf } = useLibrary();
  const all = books.flatMap((b) => recordsOf(b.id)).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);

  if (all.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-muted)" }}>아직 기록이 없어요.</div>;
  }

  return (
    <div className="uaje-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
      {all.map((r) => {
        const book = books.find((b) => b.id === r.bookId);
        const meta = RT[r.type];
        if (!book || !meta) return null;
        return (
          <button
            key={r.id}
            onClick={() => openBook(r.bookId)}
            className="uaje-tap"
            style={{ flexShrink: 0, width: 154, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 13, textAlign: "left", cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--terracotta)" }}>
              <meta.Icon size={13} />
              <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{r.date}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-primary)", marginTop: 7, fontWeight: 500 }}>{book.title}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.content}</div>
          </button>
        );
      })}
    </div>
  );
}

export default function HomeScreen({ openBook, onOpenAddFlow }) {
  const { books, weeklyBookIds, weekLabel } = useLibrary();
  const weeklyBooks = weeklyBookIds.map((id) => books.find((b) => b.id === id)).filter(Boolean);
  const isFirstRun = books.length === 0;

  if (isFirstRun) {
    return (
      <div style={{ padding: "26px 22px" }}>
        <div style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-section)", padding: "36px 26px", textAlign: "center", boxShadow: "var(--shadow-soft)" }}>
          <div style={{ fontSize: 26, marginBottom: 12 }}>🌱</div>
          <Serif as="div" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            우아재에 오신 걸 환영해요
          </Serif>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.7 }}>
            아이가 읽은 책과 그 안에서 생긴 생각을
            <br />
            차곡차곡 모아두는 공간이에요.
            <br />
            첫 책을 추가하면서 시작해볼까요?
          </p>
          <button
            onClick={onOpenAddFlow}
            className="uaje-tap"
            style={{
              marginTop: 22,
              background: "var(--terracotta)",
              color: "#FBF8F0",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "13px 26px",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <Plus size={15} /> 첫 책 추가하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: "26px 22px 4px" }}>
        <div style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-section)", padding: "24px 22px 26px", boxShadow: "var(--shadow-soft)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Serif as="div" style={{ fontSize: 18.5, fontWeight: 600, color: "var(--text-primary)" }}>
              이번 주 책
            </Serif>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{weekLabel}</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 7, lineHeight: 1.6 }}>선생님이 이번 주에 골라주신 책이에요.</p>

          {weeklyBooks.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              <WeeklyBooks books={weeklyBooks} openBook={openBook} />
            </div>
          ) : (
            <div style={{ marginTop: 18, fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>
              이번 주에 등록된 책이 아직 없어요.
            </div>
          )}

          <button
            onClick={onOpenAddFlow}
            className="uaje-tap"
            style={{ marginTop: 18, width: "100%", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-md)", padding: "12px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: 12, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            <Plus size={13} /> 책 추가
          </button>
        </div>
      </div>

      <div style={{ padding: "28px 22px 36px" }}>
        <SectionLabel label="최근 기록" />
        <RecentRecordStrip openBook={openBook} />
      </div>
    </div>
  );
}
