"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Serif, SectionLabel } from "@/components/layout/Primitives";
import { PhotoWeeklyShelf } from "@/components/books/PhotoBookShelf";
import { RT } from "@/lib/constants";
import { useLibrary } from "@/lib/LibraryContext";

// Small alternating tilt + a "washi tape" strip at the top — reads as a
// sticky note pinned up, not another bordered card. Kept subtle (matches
// the ±0.3–2° convention used everywhere else book/paper elements tilt).
const NOTE_ROTATIONS = [-1.5, 1, -0.8, 1.4, -1.2, 0.8];
const TAPE_COLORS = ["var(--terracotta)", "var(--sage)", "var(--dusty-blue)"];

function RecentRecordStrip({ openBook }) {
  const { books, recordsOf } = useLibrary();
  const all = books.flatMap((b) => recordsOf(b.id)).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);

  if (all.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-muted)" }}>아직 기록이 없어요.</div>;
  }

  return (
    <div className="uaje-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", padding: "6px 4px 10px" }}>
      {all.map((r, i) => {
        const book = books.find((b) => b.id === r.bookId);
        const meta = RT[r.type];
        if (!book || !meta) return null;
        const rotation = NOTE_ROTATIONS[i % NOTE_ROTATIONS.length];
        const tape = TAPE_COLORS[i % TAPE_COLORS.length];
        return (
          <button
            key={r.id}
            onClick={() => openBook(r.bookId)}
            className="uaje-tap"
            style={{
              flexShrink: 0,
              width: 148,
              background: "#FEFCF6",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "16px 13px 13px",
              textAlign: "left",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(80,60,40,0.14)",
              transform: `rotate(${rotation}deg)`,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -8,
                left: "50%",
                transform: `translateX(-50%) rotate(${-rotation * 0.6}deg)`,
                width: 34,
                height: 14,
                background: tape,
                opacity: 0.55,
                borderRadius: 2,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--terracotta)" }}>
              <meta.Icon size={12} />
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.date}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-primary)", marginTop: 7, fontWeight: 600 }}>{book.title}</div>
            <Serif
              as="div"
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 5,
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {r.content}
            </Serif>
          </button>
        );
      })}
    </div>
  );
}

export default function HomeScreen({ openBook, onOpenAddFlow }) {
  const { books, weeklyBookIds, weekLabel, newIds } = useLibrary();
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
      <div style={{ padding: "26px 22px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Serif as="div" style={{ fontSize: 18.5, fontWeight: 600, color: "var(--text-primary)" }}>
            이번 주 책
          </Serif>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{weekLabel}</span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 7, lineHeight: 1.6 }}>선생님이 이번 주에 골라주신 책이에요.</p>
      </div>

      <div style={{ padding: "0 22px 4px" }}>
        <PhotoWeeklyShelf books={weeklyBooks} openBook={openBook} newIds={newIds} />

        <button
          onClick={onOpenAddFlow}
          className="uaje-tap"
          style={{ marginTop: 18, width: "100%", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-md)", padding: "12px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: 12, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        >
          <Plus size={13} /> 책 추가
        </button>
      </div>

      <div style={{ padding: "28px 22px 36px" }}>
        <SectionLabel label="최근 기록" />
        <RecentRecordStrip openBook={openBook} />
      </div>
    </div>
  );
}
