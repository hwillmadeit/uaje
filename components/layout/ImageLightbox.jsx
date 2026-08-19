"use client";

import React from "react";
import { X } from "lucide-react";

export default function ImageLightbox({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(20,16,12,0.86)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <button
        onClick={onClose}
        className="uaje-tap"
        aria-label="닫기"
        style={{
          position: "absolute",
          top: "calc(18px + env(safe-area-inset-top))",
          right: 18,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.14)",
          color: "#FBF8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <X size={18} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || "표지 확대 보기"}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "var(--radius-md)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", objectFit: "contain" }}
      />
    </div>
  );
}
