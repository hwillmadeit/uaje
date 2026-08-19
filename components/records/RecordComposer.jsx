"use client";

import React, { useState, useRef } from "react";
import { Camera, Palette, Check, Pencil, Image as ImageIcon } from "lucide-react";
import { Serif, BackHeader, BookCover } from "@/components/layout/Primitives";
import { useLibrary } from "@/lib/LibraryContext";
import { bookAdapters } from "@/lib/bookAdapters";
import { RECORD_TYPES, RT } from "@/lib/constants";
import DrawingPad from "@/components/records/DrawingPad";

export default function RecordComposer({ bookId, onBack }) {
  const { books, sessionsOf, addRecord } = useLibrary();
  const book = books.find((b) => b.id === bookId);
  const sessions = sessionsOf(bookId);
  const latestSessionId = sessions.length ? sessions[sessions.length - 1].id : null;

  const [type, setType] = useState(null);
  const [text, setText] = useState("");
  const [drawingMode, setDrawingMode] = useState("draw"); // "draw" | "photo" — only used when type === "drawing"
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const drawingPadRef = useRef(null);
  const photoInputRef = useRef(null);

  if (!book) return null;

  function handlePhotoSelected(file) {
    if (!file) return;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setErrorMsg("");
    try {
      let imageUrl = null;

      if (type === "drawing" && drawingMode === "draw" && drawingPadRef.current?.hasDrawn()) {
        const blob = await drawingPadRef.current.toBlob();
        const uploaded = await bookAdapters.uploadRecordImage(blob);
        imageUrl = uploaded.url;
      } else if ((type === "drawing" || type === "photo") && photoFile) {
        const uploaded = await bookAdapters.uploadRecordImage(photoFile);
        imageUrl = uploaded.url;
      }

      await addRecord({ bookId, sessionId: latestSessionId, type, content: text.trim() || null, imageUrl });
      setSaved(true);
    } catch (e) {
      setErrorMsg("기록을 저장하는 중 문제가 생겼어요. 다시 시도해볼까요?");
    }
    setSaving(false);
  }

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 30, textAlign: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Check size={22} color="var(--sage)" />
        </div>
        <Serif as="div" style={{ fontSize: 16, color: "var(--text-primary)", fontWeight: 600 }}>
          기록이 책 옆에 놓였어요
        </Serif>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 9, lineHeight: 1.6 }}>{book.title}에 새로운 기록이 더해졌어요.</p>
        <button onClick={onBack} className="uaje-tap" style={{ marginTop: 22, background: "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-md)", padding: "12px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          책으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <BackHeader onBack={onBack} title="기록 작성" />
      <div style={{ padding: "20px 22px 6px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 4 }}>
          <BookCover book={book} width={42} height={56} compact />
          <div>
            <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{book.title}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>이 책에서 무엇이 남았나요?</div>
          </div>
        </div>
      </div>

      {!type ? (
        <div style={{ padding: "14px 22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {RECORD_TYPES.map(({ key, label, desc, Icon }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className="uaje-tap"
              style={{ textAlign: "left", background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 9 }}
            >
              <Icon size={17} color="var(--terracotta)" />
              <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.45 }}>{desc}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="uaje-paper-in" style={{ padding: "10px 22px 26px", flex: 1, display: "flex", flexDirection: "column" }}>
          <button onClick={() => setType(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer", marginBottom: 16, padding: 0 }}>
            ← 다른 종류로 기록하기
          </button>

          <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-soft)", padding: "24px 22px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {React.createElement(RT[type].Icon, { size: 15, color: "var(--terracotta)" })}
                <span style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{RT[type].label}</span>
              </div>

              {type === "drawing" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setDrawingMode("draw")}
                    className="uaje-tap"
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "5px 9px", borderRadius: "var(--radius-sm)", border: `1px solid ${drawingMode === "draw" ? "var(--terracotta)" : "var(--border)"}`, background: drawingMode === "draw" ? "var(--surface-soft)" : "none", color: drawingMode === "draw" ? "var(--terracotta)" : "var(--text-muted)", cursor: "pointer" }}
                  >
                    <Pencil size={11} /> 여기서 그리기
                  </button>
                  <button
                    onClick={() => setDrawingMode("photo")}
                    className="uaje-tap"
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "5px 9px", borderRadius: "var(--radius-sm)", border: `1px solid ${drawingMode === "photo" ? "var(--terracotta)" : "var(--border)"}`, background: drawingMode === "photo" ? "var(--surface-soft)" : "none", color: drawingMode === "photo" ? "var(--terracotta)" : "var(--text-muted)", cursor: "pointer" }}
                  >
                    <ImageIcon size={11} /> 사진으로 올리기
                  </button>
                </div>
              )}
            </div>

            {type === "drawing" && drawingMode === "draw" && (
              <div style={{ marginBottom: 16 }}>
                <DrawingPad ref={drawingPadRef} />
              </div>
            )}

            {((type === "drawing" && drawingMode === "photo") || type === "photo") &&
              (photoPreviewUrl ? (
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreviewUrl} alt="" style={{ width: 66, height: 66, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,0,0,0.06)" }} />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="uaje-tap"
                    style={{ fontSize: 11.5, color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer" }}
                  >
                    다시 선택
                  </button>
                </div>
              ) : (
                <label
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 140, border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: 12, gap: 9, cursor: "pointer", marginBottom: 16 }}
                >
                  {type === "drawing" ? <Palette size={20} /> : <Camera size={20} />}
                  사진으로 찍어서 올려주세요
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoSelected(e.target.files?.[0])} />
                </label>
              ))}

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={type === "quote" ? "아이가 한 말을 그대로 적어주세요" : type === "action" ? "책을 읽고 실제로 해본 것을 적어주세요" : "편하게 적어주세요"}
              style={{ width: "100%", minHeight: 80, border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 14, lineHeight: 1.8, color: "var(--text-primary)", fontFamily: "var(--sans)" }}
            />
          </div>

          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14, textAlign: "center" }}>그림 하나, 문장 한 줄만 남겨도 충분해요.</p>
          {errorMsg && <div style={{ fontSize: 12, color: "var(--terracotta-deep)", textAlign: "center", marginTop: 8 }}>{errorMsg}</div>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="uaje-tap"
            style={{ marginTop: 14, width: "100%", background: "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-md)", padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            {saving ? "저장하는 중..." : "기록 저장하기"}
          </button>
        </div>
      )}
    </div>
  );
}
