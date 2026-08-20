"use client";

import React, { useState } from "react";
import { Mail, Lock, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupSent, setSignupSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (signInError) {
        setError("이메일 또는 비밀번호가 올바르지 않아요.");
        return;
      }
      // 세션 쿠키는 브라우저에 계속 남아있어서, 다음에 다시 들어와도
      // 로그아웃하기 전까지는 자동으로 로그인 상태가 유지돼요.
      window.location.href = "/";
      return;
    }

    // mode === "signup"
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message.includes("already registered") ? "이미 가입된 이메일이에요. 로그인해주세요." : "가입 중 문제가 생겼어요. 다시 시도해주세요.");
      return;
    }
    // Supabase 프로젝트에서 "Confirm email"이 켜져 있으면 세션이 바로 생기지
    // 않고 메일 인증이 필요해요. 꺼져 있으면 data.session이 바로 채워집니다.
    if (data.session) {
      window.location.href = "/";
    } else {
      setSignupSent(true);
    }
  }

  return (
    <div
      className="uaje-shell"
      style={{
        fontFamily: "var(--sans)",
        margin: "0 auto",
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

      {signupSent ? (
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={20} color="var(--sage)" />
          </div>
          <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 8 }}>메일함을 확인해주세요</div>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {email}로 인증 링크를 보냈어요.
            <br />
            링크를 누르면 가입이 끝나요.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 320 }} autoComplete="on">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              marginBottom: 10,
            }}
          >
            <Mail size={15} color="var(--text-muted)" />
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--text-primary)", fontFamily: "var(--sans)" }}
            />
          </div>

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
            <Lock size={15} color="var(--text-muted)" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--text-primary)", fontFamily: "var(--sans)" }}
            />
          </div>

          {error && <div style={{ fontSize: 12, color: "var(--terracotta-deep)", marginBottom: 12, textAlign: "center" }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? "default" : "pointer",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            {loading ? "확인하는 중..." : mode === "signin" ? "로그인" : "회원가입"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: "var(--dusty-blue)", fontSize: 12, marginTop: 14, cursor: "pointer", padding: 0 }}
          >
            {mode === "signin" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
          </button>

          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            브라우저가 비밀번호 저장을 물어보면 저장해두세요.
            <br />
            다음부터는 자동으로 채워지고, 로그인 상태도 계속 유지돼요.
          </p>
        </form>
      )}
    </div>
  );
}
