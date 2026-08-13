"use client";

import React, { useState, useRef } from "react";
import { Check, Download } from "lucide-react";
import { Serif, BackHeader, SectionLabel, BookCover } from "@/components/layout/Primitives";
import { RecordCardContent } from "@/components/records/RecordCard";
import { useLibrary } from "@/lib/LibraryContext";
import { RT } from "@/lib/constants";

export default function ShareCard({ bookId, onBack }) {
  const { books, recordsOf } = useLibrary();
  const book = books.find((b) => b.id === bookId);
  const records = recordsOf(bookId);
  const [selected, setSelected] = useState(() => Object.fromEntries(records.map((r) => [r.id, true])));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const cardRef = useRef(null);

  if (!book) return null;

  const chosen = records.filter((r) => selected[r.id]);
  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  async function handleExport() {
    setSaving(true);
    setErrorMsg("");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#FBF8F0" });
      const link = document.createElement("a");
      link.download = `우아재-${book.title}.png`;
      link.href = dataUrl;
      link.click();
      setSaved(true);
    } catch (e) {
      console.error(e);
      setErrorMsg("이미지를 만드는 중 문제가 생겼어요. 다시 시도해볼까요?");
    }
    setSaving(false);
  }

  return (
    <div>
      <BackHeader onBack={onBack} title="선생님께 보내기" />
      <div style={{ padding: "18px 22px 0" }}>
        <SectionLabel label="보낼 기록 선택" />
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {records.map((r) => {
            const meta = RT[r.type];
            const on = !!selected[r.id];
            return (
              <button
                key={r.id}
                onClick={() => toggle(r.id)}
                className="uaje-tap"
                style={{ display: "flex", alignItems: "flex-start", gap: 11, textAlign: "left", background: on ? "var(--surface-soft)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "11px 13px", cursor: "pointer", opacity: on ? 1 : 0.5 }}
              >
                <div style={{ width: 17, height: 17, borderRadius: 6, border: `1.5px solid ${on ? "var(--terracotta)" : "var(--warm-tan)"}`, background: on ? "var(--terracotta)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
                  {on && <Check size={11} color="#FBF8F0" />}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {meta.label} · {r.date}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-primary)", marginTop: 3, lineHeight: 1.5 }}>{r.content}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "28px 22px 8px" }}>
        <SectionLabel label="미리보기" />
        <div ref={cardRef} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "28px 24px", boxShadow: "var(--shadow-soft)" }}>
          <div style={{ textAlign: "center" }}>
            <Serif as="div" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              우아재
            </Serif>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>우리 아이의 책 기록</div>
          </div>

          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12 }}>
            <BookCover book={book} width={50} height={68} compact />
            <div>
              <Serif as="div" style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                {book.title}
              </Serif>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>{records[records.length - 1]?.date}</div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {chosen.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>보낼 기록을 선택해주세요.</div>}
            {chosen.map((r) => (
              <RecordCardContent key={r.id} r={r} book={book} />
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 10, color: "var(--warm-tan)" }}>우아재 · 우리 아이 서재</div>
        </div>
      </div>

      <div style={{ padding: "18px 22px 36px" }}>
        <button
          onClick={handleExport}
          disabled={chosen.length === 0 || saving}
          className="uaje-tap"
          style={{ width: "100%", background: chosen.length === 0 ? "var(--border-strong)" : "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-md)", padding: "14px 0", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: chosen.length === 0 ? "default" : "pointer", boxShadow: "var(--shadow-soft)" }}
        >
          <Download size={16} /> {saving ? "이미지를 만드는 중..." : "이미지로 저장"}
        </button>
        {saved && <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--sage)", marginTop: 10 }}>이미지가 저장되었어요.</div>}
        {errorMsg && <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--terracotta-deep)", marginTop: 10 }}>{errorMsg}</div>}
      </div>
    </div>
  );
}
