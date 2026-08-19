"use client";

import React, { useState, useEffect } from "react";
import { LogOut, ChevronDown, ChevronRight, Download, Check } from "lucide-react";
import { AppHeader } from "@/components/layout/Primitives";
import { supabase } from "@/lib/supabaseClient";
import { useLibrary } from "@/lib/LibraryContext";

function SettingsRow({ label, expanded, onToggle, children }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-soft)", overflow: "hidden" }}>
      <button
        onClick={onToggle}
        className="uaje-tap"
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: "15px 17px", fontSize: 13, color: "var(--text-primary)", cursor: "pointer", textAlign: "left" }}
      >
        {label}
        {expanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
      </button>
      {expanded && (
        <div className="uaje-paper-in" style={{ padding: "0 17px 16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ChildProfileRow({ expanded, onToggle }) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setName(data?.user?.user_metadata?.child_name || "");
      setLoaded(true);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await supabase.auth.updateUser({ data: { child_name: name.trim() } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SettingsRow label={loaded && name ? `아이 프로필 · ${name}` : "아이 프로필"} expanded={expanded} onToggle={onToggle}>
      <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>우리 아이 이름</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해주세요"
          style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 11px", fontSize: 13, background: "var(--bg)", color: "var(--text-primary)", outline: "none", fontFamily: "var(--sans)" }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="uaje-tap"
          style={{ background: "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-sm)", padding: "0 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          저장
        </button>
      </div>
      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--sage)", marginTop: 8 }}>
          <Check size={11} /> 저장했어요
        </div>
      )}
    </SettingsRow>
  );
}

function ComingSoonRow({ label, expanded, onToggle, message }) {
  return (
    <SettingsRow label={label} expanded={expanded} onToggle={onToggle}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{message}</div>
    </SettingsRow>
  );
}

function ExportRow({ expanded, onToggle }) {
  const { books, sessionsOf, recordsOf } = useLibrary();
  const [done, setDone] = useState(false);

  function handleExport() {
    const data = books.map((b) => ({
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      coverImageUrl: b.cover_image_url,
      readingSessions: sessionsOf(b.id),
      records: recordsOf(b.id).map((r) => ({ type: r.type, content: r.content, imageUrl: r.imageUrl, date: r.date })),
    }));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), books: data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `우아재-백업-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <SettingsRow label="데이터 내보내기" expanded={expanded} onToggle={onToggle}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 12 }}>
        지금까지의 책·기록을 파일 하나로 내려받아요. 아이 컴퓨터를 바꾸거나 백업해두고 싶을 때 써주세요.
      </div>
      <button
        onClick={handleExport}
        className="uaje-tap"
        style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--terracotta)", color: "#FBF8F0", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
      >
        <Download size={13} /> JSON으로 저장
      </button>
      {done && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--sage)", marginTop: 8 }}>
          <Check size={11} /> 저장됐어요
        </div>
      )}
    </SettingsRow>
  );
}

export default function SettingsScreen() {
  const [openRow, setOpenRow] = useState(null);
  const toggle = (key) => setOpenRow((prev) => (prev === key ? null : key));

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div>
      <AppHeader title="더보기" />
      <div style={{ padding: "0 22px 36px", display: "flex", flexDirection: "column", gap: 11 }}>
        <ChildProfileRow expanded={openRow === "profile"} onToggle={() => toggle("profile")} />
        <ComingSoonRow
          label="선생님 연결"
          expanded={openRow === "teacher"}
          onToggle={() => toggle("teacher")}
          message="선생님 계정과 직접 연동하는 기능은 아직 준비 중이에요. 지금은 책 상세 화면의 '선생님께 보내기'로 기록 카드를 이미지로 만들어 전달할 수 있어요."
        />
        <ComingSoonRow
          label="알림 설정"
          expanded={openRow === "notif"}
          onToggle={() => toggle("notif")}
          message="읽기 알림 기능은 아직 준비 중이에요."
        />
        <ExportRow expanded={openRow === "export"} onToggle={() => toggle("export")} />

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
