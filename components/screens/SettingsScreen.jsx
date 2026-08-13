"use client";

import React from "react";
import { LogOut } from "lucide-react";
import { AppHeader } from "@/components/layout/Primitives";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsScreen() {
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div>
      <AppHeader title="더보기" />
      <div style={{ padding: "0 22px 36px", display: "flex", flexDirection: "column", gap: 11 }}>
        {["아이 프로필", "선생님 연결", "알림 설정", "데이터 내보내기"].map((label) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "15px 17px", fontSize: 13, color: "var(--text-primary)", boxShadow: "var(--shadow-soft)" }}>
            {label}
          </div>
        ))}

        <button
          onClick={handleSignOut}
          className="uaje-tap"
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "15px 17px",
            fontSize: 13,
            color: "var(--terracotta-deep)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <LogOut size={15} /> 로그아웃
        </button>
      </div>
    </div>
  );
}
