"use client";

import React, { useState } from "react";
import { Plus, Camera, Sprout } from "lucide-react";
import { BackHeader, SectionLabel, Serif, BookCover } from "@/components/layout/Primitives";
import { RecordCard } from "@/components/records/RecordCard";
import { useLibrary } from "@/lib/LibraryContext";

export default function DetailScreen({ bookId, onBack, goRecordCreate, goShare }) {
  const { books, sessionsOf, recordsOf, addReadingDate } = useLibrary();
  const book = books.find((b) => b.id === bookId);
  const sessions = sessionsOf(bookId);
  const records = recordsOf(bookId);
  const actionRecords = records.filter((r) => r.type === "action" || r.type === "photo");
  const [addingDate, setAddingDate] = useState(false);

  if (!book) return null;

  async function handleAddReadDate() {
    setAddingDate(true);
    try {
      await addReadingDate(bookId);
    } catch (e) {
      // Non-fatal — a calm inline retry is enough here.
    }
    setAddingDate(false);
  }

  return (
    <div>
      <BackHeader onBack={onBack} title="책 상세" />
      <div style={{ padding: 22 }}>
        <div style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 20, display: "flex", gap: 18 }}>
          <BookCover book={book} width={94} height={130} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
            <Serif as="div" style={{ fontSize: 19, fontWeight: 700, color: "var(--text-primary)" }}>
              {book.title}
            </Serif>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{book.author}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.8 }}>
              읽은 횟수 {sessions.length}회
              {sessions.length > 0 && (
                <>
                  <br />첫 읽음 {sessions[0].date}
                  <br />최근 읽음 {sessions[sessions.length - 1].date}
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => goRecordCreate(bookId)}
          className="uaje-tap"
          style={{ marginTop: 18, width: "100%", background: "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-md)", padding: "14px 0", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
        >
          <Plus size={16} /> 이 책에 기록하기
        </button>

        {sessions.length === 0 ? (
          <div style={{ marginTop: 22, padding: "18px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", fontSize: 12.5, color: "var(--text-secondary)", textAlign: "center" }}>
            아직 읽지 않은 책이에요. 다 읽으면 날짜를 남겨보세요.
            <div style={{ marginTop: 12 }}>
              <button
                onClick={handleAddReadDate}
                disabled={addingDate}
                className="uaje-tap"
                style={{ fontSize: 12.5, color: "var(--dusty-blue)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "7px 16px", background: "none", cursor: "pointer" }}
              >
                {addingDate ? "추가하는 중..." : "읽은 날 추가"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 30 }}>
            <SectionLabel
              label="읽은 기록"
              right={
                <button onClick={handleAddReadDate} disabled={addingDate} className="uaje-tap" style={{ fontSize: 11, color: "var(--dusty-blue)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {addingDate ? "추가하는 중..." : "+ 다시 읽었어요"}
                </button>
              }
            />
            <div style={{ position: "relative", paddingLeft: 16 }}>
              <div style={{ position: "absolute", left: 3, top: 4, bottom: 4, width: 1, background: "var(--border-strong)" }} />
              {[...sessions].reverse().map((s) => {
                const sRecords = records.filter((r) => r.sessionId === s.id);
                return (
                  <div key={s.id} style={{ position: "relative", marginBottom: 22 }}>
                    <div style={{ position: "absolute", left: -16 + 3 - 3, top: 5, width: 7, height: 7, borderRadius: "50%", background: s.number > 1 ? "var(--dusty-blue)" : "var(--terracotta)" }} />
                    <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{s.date}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                      {s.number === 1 ? "첫 번째 읽음" : `${s.number}번째 읽음`}
                      {s.number > 1 && <span style={{ color: "var(--dusty-blue)" }}> · 다시 읽기</span>}
                    </div>
                    {sRecords.length > 0 && (
                      <div className="uaje-record-grid" style={{ marginTop: 10 }}>
                        {sRecords.map((r) => (
                          <RecordCard key={r.id} r={r} book={book} />
                        ))}
                      </div>
                    )}
                    {s.number > 1 && <div style={{ fontSize: 11, color: "var(--dusty-blue)", marginTop: 8, fontStyle: "italic" }}>같은 책을 다시 읽으면서 새로운 생각이 생겼어요.</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {actionRecords.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <SectionLabel label="책에서 현실로" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {actionRecords.map((r) => (
                <div key={r.id} style={{ background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, display: "flex", gap: 10 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 7, background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {r.type === "photo" ? <Camera size={16} color="#FDF9F1" /> : <Sprout size={16} color="#FDF9F1" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--sage)" }}>{r.date}</div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2, lineHeight: 1.5 }}>{r.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {records.length > 0 && (
          <button
            onClick={() => goShare(bookId)}
            className="uaje-tap"
            style={{ marginTop: 26, width: "100%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--dusty-blue)", borderRadius: "var(--radius-md)", padding: "13px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            선생님께 보내기
          </button>
        )}
      </div>
    </div>
  );
}
