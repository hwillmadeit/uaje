"use client";

import React from "react";

function Block({ width = "100%", height = 16, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, var(--surface-soft) 25%, var(--surface-deep) 37%, var(--surface-soft) 63%)",
        backgroundSize: "400% 100%",
        animation: "uaje-shimmer 1.6s ease infinite",
        ...style,
      }}
    />
  );
}

export default function LoadingSkeleton() {
  return (
    <div style={{ padding: "26px 22px" }}>
      <style>{`@keyframes uaje-shimmer{ 0%{ background-position: 100% 50%; } 100%{ background-position: 0% 50%; } }`}</style>

      <div style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-section)", padding: "24px 22px 26px" }}>
        <Block width={90} height={18} />
        <div style={{ marginTop: 10 }}>
          <Block width={180} height={12} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Block height={100} radius={6} />
              <Block height={10} width="80%" />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <Block width={70} height={11} />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {[0, 1].map((i) => (
            <Block key={i} width={154} height={78} radius={12} />
          ))}
        </div>
      </div>
    </div>
  );
}
