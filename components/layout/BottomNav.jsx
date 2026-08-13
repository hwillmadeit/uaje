"use client";

import React from "react";
import { BookOpen, Library, PenLine, Archive as ArchiveIcon, Menu } from "lucide-react";

const NAV_ITEMS = [
  { key: "home", label: "이번 주", Icon: BookOpen },
  { key: "shelf", label: "책꽂이", Icon: Library },
  { key: "timeline", label: "기록", Icon: PenLine },
  { key: "archive", label: "아카이브", Icon: ArchiveIcon },
  { key: "settings", label: "더보기", Icon: Menu },
];

export default function BottomNav({ screen, setScreen }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        padding: "9px 4px calc(9px + env(safe-area-inset-bottom))",
        flexShrink: 0,
      }}
    >
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const active = screen === key;
        return (
          <button
            key={key}
            onClick={() => setScreen(key)}
            className="uaje-navbtn uaje-tap"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0",
              cursor: "pointer",
              color: active ? "var(--terracotta)" : "var(--warm-tan)",
            }}
          >
            <Icon size={18} strokeWidth={active ? 2.1 : 1.6} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
