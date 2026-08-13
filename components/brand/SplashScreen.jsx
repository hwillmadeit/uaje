"use client";

import React from "react";
import { Serif } from "@/components/layout/Primitives";

function SplashDoodle() {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden="true">
      <path d="M28 6 L28 12 M25 9 L31 9" stroke="var(--terracotta)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M39 9 L39 14 M36.5 11.5 L41.5 11.5" stroke="var(--sage)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 24 C14 21 20 21 26 24 L26 42 C20 39 14 39 8 42 Z" stroke="var(--wood)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M44 24 C38 21 32 21 26 24 L26 42 C32 39 38 39 44 42 Z" stroke="var(--wood)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M26 24 L26 42" stroke="var(--wood)" strokeWidth="1.1" />
      <path d="M44 40 L58 26" stroke="var(--wood-dark)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M58 26 L62 22 L64 24 L60 28 Z" fill="var(--wood-dark)" opacity="0.85" />
    </svg>
  );
}

function SplashHeart() {
  return (
    <svg width="19" height="17" viewBox="0 0 20 18" fill="none" aria-hidden="true">
      <path
        d="M10 16 C3 11 1 7 3 4 C5 1.5 8 2 10 5 C12 2 15 1.5 17 4 C19 7 17 11 10 16 Z"
        stroke="var(--terracotta)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SPLASH_LINES = [
  [
    { ch: "우", strong: true },
    { ch: "리", strong: false },
  ],
  [
    { ch: "아", strong: true },
    { ch: "이", strong: false },
  ],
  [
    { ch: "서", strong: false },
    { ch: "재", strong: true },
  ],
];

function SplashLine({ parts }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      {parts.map((p, i) => (
        <Serif
          key={i}
          style={{
            fontSize: p.strong ? 52 : 28,
            fontWeight: p.strong ? 700 : 400,
            color: p.strong ? "var(--text-primary)" : "var(--warm-tan)",
            opacity: p.strong ? 1 : 0.85,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {p.ch}
        </Serif>
      ))}
    </div>
  );
}

export default function SplashScreen({ exiting }) {
  return (
    <div
      className="uaje-splash-overlay"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 200,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        opacity: exiting ? 0 : 1,
        transition: "opacity 450ms ease",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <div className="uaje-splash-fade1" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SplashDoodle />
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {SPLASH_LINES.map((parts, i) => (
            <SplashLine key={i} parts={parts} />
          ))}
        </div>
      </div>

      <div className="uaje-splash-fade2" style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", letterSpacing: "0.01em" }}>우리 아이의 생각이 쌓이는 곳</div>
        <SplashHeart />
      </div>
    </div>
  );
}
