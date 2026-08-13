"use client";

import React, { useMemo } from "react";
import { AppHeader, SectionLabel, Serif } from "@/components/layout/Primitives";
import { useLibrary } from "@/lib/LibraryContext";
import { RT } from "@/lib/constants";

function todayLabel(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10).replaceAll("-", ".");
}

export default function RecordTimeline({ openBook }) {
  const { books, recordsOf } = useLibrary();
  const todayStr = todayLabel(0);
  const yesterdayStr = todayLabel(1);

  const all = useMemo(() => books.flatMap((b) => recordsOf(b.id)).sort((a, b) => (a.date < b.date ? 1 : -1)), [books, recordsOf]);

  const groups = useMemo(() => {
    const map = {};
    all.forEach((r) => {
      const label = r.date === todayStr ? "오늘" : r.date === yesterdayStr ? "어제" : r.date;
      map[label] = map[label] || [];
      map[label].push(r);
    });
    return Object.entries(map);
  }, [all, todayStr, yesterdayStr]);

  return (
    <div>
      <AppHeader title="기록" sub="아이의 활동을 시간순으로 모아봤어요" />
      <div style={{ padding: "0 22px 36px" }}>
        {groups.length === 0 && <div style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>아직 기록이 없어요.</div>}
        {groups.map(([label, items]) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 11 }}>{label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {items.map((r) => {
                const book = books.find((b) => b.id === r.bookId);
                const meta = RT[r.type];
                if (!book || !meta) return null;
                return (
                  <button
                    key={r.id}
                    onClick={() => openBook(r.bookId)}
                    className="uaje-tap"
                    style={{ display: "flex", gap: 11, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 13, textAlign: "left", cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
                  >
                    <meta.Icon size={15} color="var(--terracotta)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <Serif as="div" style={{ fontSize: 11.5, color: "var(--text-primary)", fontWeight: 600 }}>
                        {book.title}
                      </Serif>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.55 }}>{r.content}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
