"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";

export function Serif({ children, style = {}, as = "span" }) {
  const Comp = as;
  return <Comp style={{ fontFamily: "var(--serif)", ...style }}>{children}</Comp>;
}

export function SectionLabel({ label, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", letterSpacing: "0.01em" }}>{label}</div>
      {right}
    </div>
  );
}

export function StatusDot({ status }) {
  const color = status.tone === "accent" ? "var(--terracotta)" : status.tone === "sage" ? "var(--sage)" : "var(--text-muted)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: status.text === "읽기 전" ? "transparent" : color,
          border: status.text === "읽기 전" ? "1px solid var(--text-muted)" : "none",
          display: "inline-block",
        }}
      />
      {status.text}
    </span>
  );
}

// Renders a real cover image when book.cover_image_url is set; otherwise
// falls back to the editorial placeholder (title on a muted color field).
// Never fabricates a "real cover" look for a book with no actual image.
export function BookCover({
  book,
  width = 92,
  height = 128,
  aspectRatio,
  rounded = true,
  showAuthor = true,
  compact = false,
  showInitials = compact,
  titleLines = 3,
  className = "",
}) {
  const initials = (book.title || "").slice(0, 1);
  const hasImage = Boolean(book.cover_image_url || book.coverImageUrl);

  if (hasImage) {
    return (
      <div
        className={className}
        style={{
          width,
          height: aspectRatio ? undefined : height,
          aspectRatio: aspectRatio || undefined,
          borderRadius: rounded ? "3px 8px 8px 3px" : 4,
          boxShadow: "var(--shadow-book)",
          border: "1px solid rgba(0,0,0,0.05)",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--surface-deep)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={book.cover_image_url || book.coverImageUrl}
          alt={book.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  const color = book.color || "#B9A184";
  return (
    <div
      className={className}
      style={{
        width,
        height: aspectRatio ? undefined : height,
        aspectRatio: aspectRatio || undefined,
        borderRadius: rounded ? "3px 8px 8px 3px" : 4,
        background: `linear-gradient(150deg, ${color}, ${color}D9)`,
        boxShadow: "var(--shadow-book)",
        border: "1px solid rgba(0,0,0,0.05)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: compact ? "8px 7px" : "12px 11px",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 5, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.28)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 60% at 15% 0%, rgba(255,255,255,0.16), transparent 60%)" }} />
      <Serif
        style={{
          color: "rgba(255,255,255,0.97)",
          fontSize: compact ? 10 : 13.5,
          lineHeight: 1.3,
          fontWeight: 600,
          wordBreak: "keep-all",
          position: "relative",
          display: "-webkit-box",
          WebkitLineClamp: titleLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {book.title}
      </Serif>
      {showAuthor && !compact && book.author && (
        <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 10.5, position: "relative" }}>{book.author}</span>
      )}
      {showInitials && <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, position: "relative" }}>{initials}</span>}
    </div>
  );
}

export function AppHeader({ title, sub }) {
  return (
    <div style={{ padding: "28px 22px 20px" }}>
      <Serif as="div" style={{ fontSize: 27, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        {title}
      </Serif>
      {sub && <div style={{ marginTop: 5, fontSize: 12.5, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

export function BackHeader({ onBack, title }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "18px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <button
        onClick={onBack}
        className="uaje-tap"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        aria-label="뒤로 가기"
      >
        <ChevronLeft size={17} color="var(--text-primary)" />
      </button>
      <Serif as="div" style={{ fontSize: 16.5, fontWeight: 600, color: "var(--text-primary)" }}>
        {title}
      </Serif>
    </div>
  );
}
