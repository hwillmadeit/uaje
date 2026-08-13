"use client";

import React from "react";
import { Palette, Camera, Sprout } from "lucide-react";
import { Serif } from "@/components/layout/Primitives";
import { RT } from "@/lib/constants";

export function RecordCardContent({ r, book }) {
  const meta = RT[r.type];
  if (r.type === "drawing") {
    return (
      <div>
        {r.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.imageUrl} alt={r.content || "그림"} style={{ width: "100%", height: 132, objectFit: "cover", borderRadius: "var(--radius-md)" }} />
        ) : (
          <div style={{ height: 132, borderRadius: "var(--radius-md)", background: `${book.color || "#B9A184"}26`, border: `1px solid ${book.color || "#B9A184"}44`, display: "flex", alignItems: "center", justifyContent: "center", color: book.color || "#B9A184" }}>
            <Palette size={22} />
          </div>
        )}
        <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>{r.content}</div>
      </div>
    );
  }
  if (r.type === "photo" || r.type === "action") {
    return (
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ width: 56, height: 56, borderRadius: "var(--radius-sm)", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {r.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            React.createElement(r.type === "photo" ? Camera : Sprout, { size: 18, color: "#FBF8F0" })
          )}
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{meta.label}</div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 3, lineHeight: 1.55 }}>{r.content}</div>
        </div>
      </div>
    );
  }
  if (r.type === "quote" || r.type === "scene") {
    return (
      <div>
        <div style={{ fontSize: 10.5, color: "var(--terracotta)", fontWeight: 600 }}>{meta.label}</div>
        <Serif as="div" style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7, marginTop: 4 }}>
          “{r.content}”
        </Serif>
      </div>
    );
  }
  if (r.type === "diary") {
    return (
      <div style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 22px, var(--border) 23px)", padding: "2px 0 4px" }}>
        <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 6 }}>{meta.label}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: "23px" }}>{r.content}</div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{meta.label}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-primary)", marginTop: 4, lineHeight: 1.6 }}>{r.content}</div>
    </div>
  );
}

export function RecordCard({ r, book }) {
  const meta = RT[r.type];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 14, boxShadow: "var(--shadow-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "var(--text-muted)", fontSize: 10.5 }}>
        <meta.Icon size={12} color="var(--terracotta)" />
        {r.date}
      </div>
      <RecordCardContent r={r} book={book} />
    </div>
  );
}
