"use client";

import React, { useState, useRef } from "react";
import { Camera, X, Search, Image as ImageIcon, RotateCcw, HelpCircle, PenSquare, ScanLine, Check } from "lucide-react";
import { Serif, BackHeader } from "@/components/layout/Primitives";
import { useLibrary } from "@/lib/LibraryContext";
import { bookAdapters } from "@/lib/bookAdapters";
import { resolveDetections } from "@/lib/resolveDetections";
import { warpQuadToRect } from "@/lib/perspectiveCrop";
import { resizeImageForVision } from "@/lib/resizeImage";
import { STATUS_META } from "@/lib/constants";

function FlowHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 2 }}>
      <Serif as="div" style={{ fontSize: 16.5, fontWeight: 600, color: "var(--text-primary)" }}>
        {title}
      </Serif>
      <button
        onClick={onClose}
        className="uaje-tap"
        style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        aria-label="닫기"
      >
        <X size={15} color="var(--text-primary)" />
      </button>
    </div>
  );
}

function CoverChip({ color, coverImageUrl, size = 40 }) {
  if (coverImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverImageUrl} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(0,0,0,0.06)" }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: color ? `linear-gradient(150deg, ${color}, ${color}D9)` : "var(--surface-deep)", border: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }} />
  );
}

function SearchCandidateRow({ candidate, onSelect }) {
  return (
    <button
      onClick={() => onSelect(candidate)}
      className="uaje-tap"
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, cursor: "pointer" }}
    >
      <CoverChip color={candidate.color} coverImageUrl={candidate.coverImageUrl} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600 }}>{candidate.title}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {candidate.author || "저자 미상"}
          {candidate.source === "library" && <span style={{ color: "var(--dusty-blue)" }}> · 이미 서재에 있어요</span>}
        </div>
      </div>
    </button>
  );
}

function SearchPanel({ query, results, onQueryChange, onSelect, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
        <Search size={15} color="var(--text-muted)" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder || "책 제목을 입력해주세요"}
          autoFocus
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--sans)" }}
        />
      </div>
      {query.trim() && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "14px 0" }}>검색 결과가 없어요.</div>
          ) : (
            results.map((c, i) => <SearchCandidateRow key={i} candidate={c} onSelect={onSelect} />)
          )}
        </div>
      )}
    </div>
  );
}

function pillBtnStyle(active = false) {
  return {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    fontSize: 11.5,
    fontWeight: 600,
    padding: "8px 0",
    borderRadius: "var(--radius-sm)",
    border: `1px solid ${active ? "var(--terracotta)" : "var(--border)"}`,
    background: active ? "var(--terracotta)" : "var(--surface-soft)",
    color: active ? "#FBF8F0" : "var(--text-secondary)",
    cursor: "pointer",
  };
}

function DetectionCard({ item, isEditing, onToggleConfirm, onOpenEdit, onCloseEdit, editQuery, editResults, onEditQueryChange, onEditSelect, onRetakeFromHere }) {
  const meta = STATUS_META[item.status];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 14, boxShadow: "var(--shadow-soft)" }}>
      <div style={{ display: "flex", gap: 12 }}>
        {item.status === "not_found" ? (
          <div style={{ width: 44, height: 58, borderRadius: 6, border: "1.5px dashed var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
            <HelpCircle size={16} />
          </div>
        ) : item.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverImageUrl} alt="" style={{ width: 44, height: 58, borderRadius: "2px 6px 6px 2px", objectFit: "cover", border: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 44, height: 58, borderRadius: "2px 6px 6px 2px", background: `linear-gradient(150deg, ${item.color}, ${item.color}D9)`, border: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {item.status === "not_found" ? (
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>제목을 알아보지 못했어요</div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{item.author || "저자 미상"}</div>
            </>
          )}
          <div style={{ fontSize: 10.5, color: meta.color, marginTop: 6, lineHeight: 1.5 }}>{meta.label}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {item.status === "not_found" ? (
          <>
            <button onClick={onRetakeFromHere} className="uaje-tap" style={pillBtnStyle()}>
              <RotateCcw size={12} /> 다시 촬영
            </button>
            <button onClick={onOpenEdit} className="uaje-tap" style={pillBtnStyle(true)}>
              <Search size={12} /> 직접 검색
            </button>
          </>
        ) : (
          <>
            <button onClick={onToggleConfirm} className="uaje-tap" style={pillBtnStyle(item.confirmed)}>
              <Check size={12} /> 맞아요
            </button>
            <button onClick={onOpenEdit} className="uaje-tap" style={pillBtnStyle()}>
              <PenSquare size={12} /> 수정
            </button>
          </>
        )}
      </div>

      {isEditing && (
        <div className="uaje-paper-in" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <SearchPanel query={editQuery} results={editResults} onQueryChange={onEditQueryChange} onSelect={onEditSelect} placeholder="올바른 책 제목을 검색해주세요" />
          <button onClick={onCloseEdit} style={{ marginTop: 10, background: "none", border: "none", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer", padding: 0 }}>
            검색 닫기
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddBookFlow({ onClose }) {
  const { addResolvedBooks } = useLibrary();
  const [step, setStep] = useState("sheet");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [detections, setDetections] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editQuery, setEditQuery] = useState("");
  const [editResults, setEditResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualStatus, setManualStatus] = useState("found"); // "found" | "duplicate"
  const [manualExistingBookId, setManualExistingBookId] = useState(null);
  const [manualCoverBlob, setManualCoverBlob] = useState(null);
  const [manualCoverPreviewUrl, setManualCoverPreviewUrl] = useState(null);
  const [manualCoverBusy, setManualCoverBusy] = useState(false);
  const [manualCoverMsg, setManualCoverMsg] = useState("");
  const [manualSearchOpen, setManualSearchOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [manualDrafts, setManualDrafts] = useState([]); // [{ id, title, author, status, existingBookId, coverBlob, coverPreviewUrl }]
  const manualDraftSeq = useRef(0);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notConfiguredMsg, setNotConfiguredMsg] = useState("");
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const manualCoverInputRef = useRef(null);

  function handlePhotoSelected(file) {
    if (!file) return;
    setErrorMsg("");
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoUrl(url);
    setStep("preview");
  }

  function retake() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(null);
    setPhotoUrl(null);
    setDetections([]);
    setStep("camera");
  }

  async function analyze() {
    setStep("analyzing");
    setErrorMsg("");
    try {
      const resized = await resizeImageForVision(photoFile);
      const raw = await bookAdapters.identifyBooksFromImage(resized);
      if (raw.notConfigured) {
        setNotConfiguredMsg(raw.message);
        setStep("preview");
        return;
      }
      const resolved = await resolveDetections(raw.detections);
      setDetections(resolved);
      setStep("results");
    } catch (e) {
      setErrorMsg("책을 찾는 중 문제가 생겼어요. 사진을 다시 사용해볼까요?");
      setStep("preview");
    }
  }

  function toggleConfirm(slotId) {
    setDetections((prev) => prev.map((d) => (d.slotId === slotId ? { ...d, confirmed: !d.confirmed } : d)));
  }

  function openEdit(slotId) {
    setEditingSlot(slotId);
    setEditQuery("");
    setEditResults([]);
  }

  async function runEditSearch(q) {
    setEditQuery(q);
    if (!q.trim()) {
      setEditResults([]);
      return;
    }
    const res = await bookAdapters.searchBook(q);
    setEditResults(res);
  }

  function applyEditSelection(slotId, candidate) {
    setDetections((prev) =>
      prev.map((d) => {
        if (d.slotId !== slotId) return d;
        return candidate.source === "library"
          ? { ...d, status: "duplicate", confirmed: true, title: candidate.title, author: candidate.author, color: candidate.color, coverImageUrl: candidate.coverImageUrl, existingBookId: candidate.existingBookId, catalogId: undefined }
          : { ...d, status: "found", confirmed: true, title: candidate.title, author: candidate.author, color: candidate.color, coverImageUrl: candidate.coverImageUrl, publisher: candidate.publisher, existingBookId: undefined };
      })
    );
    setEditingSlot(null);
  }

  const confirmedItems = detections.filter((d) => d.confirmed && d.status !== "not_found");

  async function handleConfirmResults() {
    setBusy(true);
    setErrorMsg("");
    try {
      const result = await addResolvedBooks(confirmedItems);
      setSummary(result);
      setStep("success");
    } catch (e) {
      setErrorMsg("책을 등록하는 중 문제가 생겼어요. 다시 시도해볼까요?");
    }
    setBusy(false);
  }

  async function runStandaloneSearch(q) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await bookAdapters.searchBook(q);
    setSearchResults(res);
  }

  async function selectStandaloneResult(candidate) {
    setBusy(true);
    setErrorMsg("");
    const item =
      candidate.source === "library"
        ? { slotId: "manual", status: "duplicate", confirmed: true, title: candidate.title, author: candidate.author, color: candidate.color, coverImageUrl: candidate.coverImageUrl, existingBookId: candidate.existingBookId }
        : { slotId: "manual", status: "found", confirmed: true, title: candidate.title, author: candidate.author, color: candidate.color, coverImageUrl: candidate.coverImageUrl, publisher: candidate.publisher };
    try {
      const result = await addResolvedBooks([item]);
      setSummary(result);
      setStep("success");
    } catch (e) {
      setErrorMsg("책을 등록하는 중 문제가 생겼어요. 다시 시도해볼까요?");
    }
    setBusy(false);
  }

  async function handleManualCoverSelected(file) {
    if (!file) return;
    setManualCoverMsg("");
    setErrorMsg("");
    setManualCoverBusy(true);
    try {
      const resized = await resizeImageForVision(file);
      const result = await bookAdapters.identifyCover(resized);
      if (result.notConfigured) {
        setManualCoverMsg(result.message);
        setManualCoverBusy(false);
        return;
      }
      const corners = result.corners || { tl: { x: 0, y: 0 }, tr: { x: 1, y: 0 }, br: { x: 1, y: 1 }, bl: { x: 0, y: 1 } };
      // Warp from the original file, not the downscaled copy — the corner
      // coordinates are 0..1 ratios, so they apply the same either way,
      // but starting from the original keeps the saved cover sharp.
      const croppedBlob = await warpQuadToRect(file, corners);
      if (manualCoverPreviewUrl) URL.revokeObjectURL(manualCoverPreviewUrl);
      setManualCoverBlob(croppedBlob);
      setManualCoverPreviewUrl(URL.createObjectURL(croppedBlob));
      if (result.title) setManualTitle(result.title);
      if (result.author) setManualAuthor(result.author);
      if (!result.title) {
        setManualCoverMsg("표지는 잘라냈지만 제목은 읽지 못했어요. 직접 입력해주세요.");
      } else {
        setManualCoverMsg("자동으로 읽은 제목이에요. 그림체 글씨는 틀릴 수 있으니, 아래 '검색해서 확인하기'로 한 번 확인해보세요.");
      }
      setManualStatus("found");
      setManualExistingBookId(null);
    } catch (e) {
      setManualCoverMsg("표지를 읽는 중 문제가 생겼어요. 사진을 다시 선택해볼까요?");
    }
    setManualCoverBusy(false);
  }

  function clearManualCover() {
    if (manualCoverPreviewUrl) URL.revokeObjectURL(manualCoverPreviewUrl);
    setManualCoverBlob(null);
    setManualCoverPreviewUrl(null);
    setManualCoverMsg("");
  }

  function resetManualForm() {
    setManualTitle("");
    setManualAuthor("");
    setManualStatus("found");
    setManualExistingBookId(null);
    setManualCoverBlob(null);
    setManualCoverPreviewUrl(null);
    setManualCoverMsg("");
    setManualSearchOpen(false);
    setManualSearchQuery("");
    setManualSearchResults([]);
  }

  async function runManualSearch(q) {
    setManualSearchQuery(q);
    if (!q.trim()) {
      setManualSearchResults([]);
      return;
    }
    const res = await bookAdapters.searchBook(q);
    setManualSearchResults(res);
  }

  // Vision's OCR guess can misread stylized/hand-drawn title fonts —
  // letting the person check the guess against real catalog/library data
  // (instead of trusting the raw vision read as final) is what actually
  // fixes that, the same way the multi-book flow's "수정" already does.
  function applyManualSearchSelection(candidate) {
    setManualTitle(candidate.title);
    setManualAuthor(candidate.author || "");
    if (candidate.source === "library") {
      setManualStatus("duplicate");
      setManualExistingBookId(candidate.existingBookId);
      setManualCoverMsg("이미 서재에 있는 책이에요 — 다시 읽기로 기록돼요.");
    } else {
      setManualStatus("found");
      setManualExistingBookId(null);
      setManualCoverMsg("");
    }
    setManualSearchOpen(false);
  }

  // Pushes the book currently in the form into the draft list, then clears
  // the form so the next book can be entered — this is what makes "직접
  // 입력" work for several books in one session instead of just one.
  function addCurrentToManualDrafts() {
    if (!manualTitle.trim()) return;
    manualDraftSeq.current += 1;
    setManualDrafts((prev) => [
      ...prev,
      {
        id: manualDraftSeq.current,
        title: manualTitle.trim(),
        author: manualAuthor.trim() || null,
        status: manualStatus,
        existingBookId: manualExistingBookId,
        coverBlob: manualCoverBlob,
        coverPreviewUrl: manualCoverPreviewUrl,
      },
    ]);
    // Ownership of the object URL moves to the draft list — don't revoke it
    // here, just clear the form's own pointer to it.
    resetManualForm();
  }

  function removeManualDraft(id) {
    setManualDrafts((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target?.coverPreviewUrl) URL.revokeObjectURL(target.coverPreviewUrl);
      return prev.filter((d) => d.id !== id);
    });
  }

  async function submitManual() {
    // Whatever's still sitting in the form counts too — no need to make
    // the user press "목록에 추가" for the very last book before submitting.
    const pending = manualTitle.trim()
      ? [{ id: "current", title: manualTitle.trim(), author: manualAuthor.trim() || null, status: manualStatus, existingBookId: manualExistingBookId, coverBlob: manualCoverBlob }]
      : [];
    const allDrafts = [...manualDrafts, ...pending];
    if (allDrafts.length === 0) return;

    setBusy(true);
    setErrorMsg("");
    try {
      const items = [];
      for (const draft of allDrafts) {
        let coverImageUrl = null;
        if (draft.coverBlob && draft.status !== "duplicate") {
          const uploaded = await bookAdapters.uploadCover(draft.coverBlob);
          coverImageUrl = uploaded.url;
        }
        items.push({
          slotId: `manual-${draft.id}`,
          status: draft.status,
          confirmed: true,
          title: draft.title,
          author: draft.author,
          color: null,
          coverImageUrl,
          existingBookId: draft.existingBookId,
        });
      }
      const result = await addResolvedBooks(items);
      setSummary(result);
      setStep("success");
    } catch (e) {
      setErrorMsg("책을 등록하는 중 문제가 생겼어요. 다시 시도해볼까요?");
    }
    setBusy(false);
  }

  const overlayBase = { position: "absolute", inset: 0, zIndex: 40, background: "var(--bg)", display: "flex", flexDirection: "column" };

  if (step === "sheet") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(51,43,36,0.36)" }} />
        <div className="uaje-paper-in" style={{ position: "relative", background: "var(--surface)", borderRadius: "var(--radius-section) var(--radius-section) 0 0", padding: "26px 22px calc(28px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 24px rgba(80,60,40,0.14)" }}>
          <Serif as="div" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18, textAlign: "center" }}>
            책을 어떻게 추가할까요?
          </Serif>

          <button
            onClick={() => setStep("camera")}
            className="uaje-tap"
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "var(--surface-soft)", border: "1.5px solid var(--terracotta)", borderRadius: "var(--radius-lg)", padding: 16, textAlign: "left", cursor: "pointer", marginBottom: 10 }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--terracotta)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Camera size={19} color="#FBF8F0" />
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 700 }}>여러 권 촬영하기</div>
              <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 2 }}>책 표지를 한 번에 찍어보세요.</div>
            </div>
          </button>

          <button
            onClick={() => setStep("search")}
            className="uaje-tap"
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 15, textAlign: "left", cursor: "pointer", marginBottom: 10 }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Search size={16} color="var(--dusty-blue)" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>제목으로 찾기</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>책 제목을 직접 검색해요.</div>
            </div>
          </button>

          <button
            onClick={() => setStep("manual")}
            className="uaje-tap"
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 15, textAlign: "left", cursor: "pointer" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PenSquare size={16} color="var(--sage)" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>직접 입력</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>책 정보를 직접 입력해요.</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (step === "camera") {
    return (
      <div style={overlayBase}>
        <FlowHeader title="여러 권 촬영하기" onClose={onClose} />
        <div className="uaje-scroll" style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          <div style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ScanLine size={22} color="var(--terracotta)" />
            </div>
            <Serif as="p" style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.8 }}>
              책 표지가 잘 보이도록
              <br />책을 나란히 놓고 찍어주세요.
            </Serif>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>가능하면 책끼리 겹치지 않게 해주세요.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="uaje-tap"
              style={{ width: "100%", background: "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-md)", padding: "15px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "var(--shadow-soft)" }}
            >
              <Camera size={17} /> 사진 촬영하기
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="uaje-tap"
              style={{ width: "100%", background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <ImageIcon size={16} /> 사진첩에서 선택
            </button>
          </div>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handlePhotoSelected(e.target.files?.[0])} />
          <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoSelected(e.target.files?.[0])} />
        </div>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div style={overlayBase}>
        <FlowHeader title="사진 확인" onClose={onClose} />
        <div className="uaje-scroll" style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="촬영한 책 사진" style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} />
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>이 사진으로 책을 찾아볼까요?</p>
          {notConfiguredMsg && <div style={{ marginTop: 12, fontSize: 12, color: "var(--dusty-blue)", textAlign: "center", lineHeight: 1.6 }}>{notConfiguredMsg}</div>}
          {errorMsg && <div style={{ marginTop: 12, fontSize: 12, color: "var(--terracotta-deep)", textAlign: "center" }}>{errorMsg}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button onClick={retake} className="uaje-tap" style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "13px 0", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
              다시 찍기
            </button>
            <button onClick={analyze} className="uaje-tap" style={{ flex: 1, background: "var(--terracotta)", border: "none", borderRadius: "var(--radius-md)", padding: "13px 0", fontSize: 13.5, fontWeight: 700, color: "#FBF8F0", cursor: "pointer", boxShadow: "var(--shadow-soft)" }}>
              이 사진 사용하기
            </button>
          </div>
          {notConfiguredMsg && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={() => setStep("search")} className="uaje-tap" style={{ flex: 1, background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "11px 0", fontSize: 12.5, color: "var(--dusty-blue)", cursor: "pointer" }}>
                제목으로 찾기
              </button>
              <button onClick={() => setStep("manual")} className="uaje-tap" style={{ flex: 1, background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "11px 0", fontSize: 12.5, color: "var(--sage)", cursor: "pointer" }}>
                직접 입력
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "analyzing") {
    return (
      <div style={{ ...overlayBase, alignItems: "center", justifyContent: "center", textAlign: "center", padding: 30 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--terracotta)", animation: "uaje-spin 900ms linear infinite", marginBottom: 22 }} />
        <Serif as="div" style={{ fontSize: 15.5, color: "var(--text-primary)", fontWeight: 600 }}>
          책을 찾고 있어요
        </Serif>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.6 }}>
          사진 속 책을 하나씩 살펴보고 있어요.
          <br />잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  if (step === "results") {
    const foundCount = confirmedItems.length;
    return (
      <div style={overlayBase}>
        <FlowHeader title="인식 결과" onClose={onClose} />
        <div className="uaje-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 22px 110px" }}>
          <Serif as="div" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            {foundCount}권을 찾았어요.
          </Serif>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>내용을 확인하고, 다르면 수정해주세요.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {detections.map((item) => (
              <DetectionCard
                key={item.slotId}
                item={item}
                isEditing={editingSlot === item.slotId}
                onToggleConfirm={() => toggleConfirm(item.slotId)}
                onOpenEdit={() => openEdit(item.slotId)}
                onCloseEdit={() => setEditingSlot(null)}
                editQuery={editQuery}
                editResults={editResults}
                onEditQueryChange={runEditSearch}
                onEditSelect={(c) => applyEditSelection(item.slotId, c)}
                onRetakeFromHere={retake}
              />
            ))}
          </div>
          {errorMsg && <div style={{ marginTop: 14, fontSize: 12, color: "var(--terracotta-deep)", textAlign: "center" }}>{errorMsg}</div>}
        </div>

        <div style={{ position: "sticky", bottom: 0, padding: "14px 22px calc(16px + env(safe-area-inset-bottom))", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleConfirmResults}
            disabled={foundCount === 0 || busy}
            className="uaje-tap"
            style={{ width: "100%", background: foundCount === 0 ? "var(--border-strong)" : "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-md)", padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: foundCount === 0 ? "default" : "pointer", boxShadow: "var(--shadow-soft)" }}
          >
            {busy ? "추가하는 중..." : `${foundCount}권 추가하기`}
          </button>
        </div>
      </div>
    );
  }

  if (step === "search") {
    return (
      <div style={overlayBase}>
        <FlowHeader title="제목으로 찾기" onClose={onClose} />
        <div className="uaje-scroll" style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          <SearchPanel query={searchQuery} results={searchResults} onQueryChange={runStandaloneSearch} onSelect={selectStandaloneResult} />
          {busy && <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>추가하는 중...</div>}
          {errorMsg && <div style={{ marginTop: 14, fontSize: 12, color: "var(--terracotta-deep)", textAlign: "center" }}>{errorMsg}</div>}
        </div>
      </div>
    );
  }

  if (step === "manual") {
    const pendingCount = manualDrafts.length + (manualTitle.trim() ? 1 : 0);
    return (
      <div style={overlayBase}>
        <FlowHeader title="직접 입력" onClose={onClose} />
        <div className="uaje-scroll" style={{ flex: 1, overflowY: "auto", padding: "22px 22px 110px" }}>
          {manualDrafts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>추가할 책 목록 · {manualDrafts.length}권</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {manualDrafts.map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "9px 12px" }}>
                    {d.coverPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.coverPreviewUrl} alt="" style={{ width: 32, height: 44, objectFit: "cover", borderRadius: "2px 6px 6px 2px", flexShrink: 0, border: "1px solid rgba(0,0,0,0.06)" }} />
                    ) : (
                      <div style={{ width: 32, height: 44, borderRadius: "2px 6px 6px 2px", background: "var(--surface-deep)", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                      {d.author && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.author}</div>}
                      {d.status === "duplicate" && <div style={{ fontSize: 10.5, color: "var(--dusty-blue)", marginTop: 2 }}>이미 서재에 있어요</div>}
                    </div>
                    <button onClick={() => removeManualDraft(d.id)} className="uaje-tap" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, flexShrink: 0 }} aria-label="목록에서 빼기">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            {manualDrafts.length > 0 ? `${manualDrafts.length + 1}번째 책` : "책 정보"}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>표지 사진 (선택)</label>

            {manualCoverPreviewUrl ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={manualCoverPreviewUrl} alt="표지 미리보기" style={{ width: 66, height: 92, objectFit: "cover", borderRadius: "3px 8px 8px 3px", boxShadow: "var(--shadow-book)", border: "1px solid rgba(0,0,0,0.06)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--sage)", marginBottom: 4 }}>표지를 잘라냈어요</div>
                  <button onClick={clearManualCover} className="uaje-tap" style={{ fontSize: 11.5, color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer" }}>
                    다시 찍기
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => manualCoverInputRef.current?.click()}
                disabled={manualCoverBusy}
                className="uaje-tap"
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 96,
                  border: "1.5px dashed var(--border-strong)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {manualCoverBusy ? (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--terracotta)", animation: "uaje-spin 900ms linear infinite" }} />
                ) : (
                  <>
                    <Camera size={19} color="var(--terracotta)" />
                    표지를 찍으면 제목을 자동으로 채워드려요
                  </>
                )}
              </button>
            )}

            {manualCoverMsg && <div style={{ fontSize: 11.5, color: "var(--dusty-blue)", marginTop: 8, lineHeight: 1.5 }}>{manualCoverMsg}</div>}

            <input
              ref={manualCoverInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleManualCoverSelected(e.target.files?.[0])}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>책 제목</label>
              <input
                value={manualTitle}
                onChange={(e) => {
                  setManualTitle(e.target.value);
                  if (manualStatus === "duplicate") {
                    setManualStatus("found");
                    setManualExistingBookId(null);
                  }
                }}
                placeholder="예: 강아지똥"
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: 13.5, background: "var(--surface)", color: "var(--text-primary)", outline: "none", fontFamily: "var(--sans)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>저자 (선택)</label>
              <input
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
                placeholder="예: 권정생"
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: 13.5, background: "var(--surface)", color: "var(--text-primary)", outline: "none", fontFamily: "var(--sans)" }}
              />
            </div>
          </div>

          {manualStatus === "duplicate" && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--dusty-blue)" }}>이미 서재에 있는 책이에요 — 다시 읽기로 기록돼요.</div>
          )}

          <button
            onClick={() => setManualSearchOpen((v) => !v)}
            disabled={!manualTitle.trim()}
            className="uaje-tap"
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              color: manualTitle.trim() ? "var(--dusty-blue)" : "var(--text-muted)",
              fontSize: 12,
              cursor: manualTitle.trim() ? "pointer" : "default",
              padding: 0,
            }}
          >
            <Search size={12} /> {manualSearchOpen ? "검색 닫기" : "검색해서 확인하기"}
          </button>

          {manualSearchOpen && (
            <div className="uaje-paper-in" style={{ marginTop: 10 }}>
              <SearchPanel query={manualSearchQuery} results={manualSearchResults} onQueryChange={runManualSearch} onSelect={applyManualSearchSelection} placeholder="정확한 제목으로 검색해보세요" />
            </div>
          )}

          <button
            onClick={addCurrentToManualDrafts}
            disabled={!manualTitle.trim()}
            className="uaje-tap"
            style={{
              marginTop: 14,
              width: "100%",
              border: "1px dashed var(--border-strong)",
              borderRadius: "var(--radius-md)",
              padding: "12px 0",
              textAlign: "center",
              color: manualTitle.trim() ? "var(--dusty-blue)" : "var(--text-muted)",
              fontSize: 12.5,
              background: "none",
              cursor: manualTitle.trim() ? "pointer" : "default",
            }}
          >
            + 목록에 추가하고 다음 책 입력하기
          </button>

          {errorMsg && <div style={{ marginTop: 14, fontSize: 12, color: "var(--terracotta-deep)", textAlign: "center" }}>{errorMsg}</div>}
        </div>

        <div style={{ position: "sticky", bottom: 0, padding: "14px 22px calc(16px + env(safe-area-inset-bottom))", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={submitManual}
            disabled={pendingCount === 0 || busy}
            className="uaje-tap"
            style={{
              width: "100%",
              background: pendingCount === 0 ? "var(--border-strong)" : "var(--terracotta)",
              color: "#FBF8F0",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "14px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: pendingCount === 0 ? "default" : "pointer",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            {busy ? "추가하는 중..." : `${pendingCount}권 추가하기`}
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    const count = summary?.addedCount ?? 0;
    return (
      <div style={{ ...overlayBase, alignItems: "center", justifyContent: "center", textAlign: "center", padding: 30 }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Check size={22} color="var(--sage)" />
        </div>
        <Serif as="div" style={{ fontSize: 16, color: "var(--text-primary)", fontWeight: 700 }}>
          {count}권이 이번 주 책에 추가됐어요.
        </Serif>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 9, lineHeight: 1.6 }}>책꽂이에도 자동으로 반영됐어요.</p>
        <button onClick={onClose} className="uaje-tap" style={{ marginTop: 22, background: "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-md)", padding: "12px 26px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          이번 주 책 보기
        </button>
      </div>
    );
  }

  return null;
}
