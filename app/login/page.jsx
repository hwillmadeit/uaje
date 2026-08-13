"use client";

import React, { useState } from "react";
import { Mail, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    setSending(false);
    if (signInError) {
      setError("메일을 보내는 중 문제가 생겼어요. 다시 시도해주세요.");
      return;
    }
    setSent(true);
  }

  return (
    <div
      className="uaje-shell"
      style={{
        fontFamily: "var(--sans)",
        margin: "0 auto",
        height: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 28px",
      }}
    >
      <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>우아재</div>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 32 }}>우리 아이의 책과 생각이 자라는 곳</div>

      {sent ? (
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={20} color="var(--sage)" />
          </div>
          <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 8 }}>메일함을 확인해주세요</div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {email}로 로그인 링크를 보냈어요.
            <br />
            링크를 누르면 바로 들어와져요.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 320 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <Mail size={15} color="var(--text-muted)" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--text-primary)", fontFamily: "var(--sans)" }}
            />
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--terracotta-deep)", marginBottom: 12, textAlign: "center" }}>{error}</div>}
          <button
            type="submit"
            disabled={sending}
            className="uaje-tap"
            style={{
              width: "100%",
              background: "var(--terracotta)",
              color: "#FBF8F0",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "13px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: sending ? "default" : "pointer",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            {sending ? "보내는 중..." : "로그인 링크 받기"}
          </button>
          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
            비밀번호 없이, 메일로 받은 링크로 로그인해요.
          </p>
        </form>
      )}
    </div>
  );
}
