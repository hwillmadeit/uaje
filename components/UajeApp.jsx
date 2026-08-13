"use client";

import React, { useState, useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import SplashScreen from "@/components/brand/SplashScreen";
import HomeScreen from "@/components/screens/HomeScreen";
import ShelfScreen from "@/components/screens/ShelfScreen";
import DetailScreen from "@/components/screens/DetailScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import RecordComposer from "@/components/records/RecordComposer";
import RecordTimeline from "@/components/records/RecordTimeline";
import ShareCard from "@/components/sharing/ShareCard";
import Archive from "@/components/archive/Archive";
import AddBookFlow from "@/components/books/AddBookFlow";
import { useLibrary } from "@/lib/LibraryContext";

export default function UajeApp() {
  const { loading, error } = useLibrary();
  const [screen, setScreen] = useState("home");
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [addFlowOpen, setAddFlowOpen] = useState(false);

  const [splashVisible, setSplashVisible] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = reduced ? 150 : 2500;
    const fadeMs = reduced ? 0 : 450;
    const t1 = setTimeout(() => setSplashExiting(true), holdMs);
    const t2 = setTimeout(() => setSplashVisible(false), holdMs + fadeMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const openBook = (id) => {
    setSelectedBookId(id);
    setScreen("detail");
  };
  const goRecordCreate = (id) => {
    setSelectedBookId(id);
    setScreen("recordCreate");
  };
  const goShare = (id) => {
    setSelectedBookId(id);
    setScreen("share");
  };

  const subScreens = ["detail", "recordCreate", "share"];
  const showNav = !subScreens.includes(screen);

  let content;
  if (loading) {
    content = (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 30 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>책장을 준비하고 있어요...</div>
      </div>
    );
  } else if (error) {
    content = (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 30, textAlign: "center" }}>
        <div style={{ fontSize: 12.5, color: "var(--terracotta-deep)", lineHeight: 1.6 }}>
          서재를 불러오는 중 문제가 생겼어요.
          <br />
          {error}
        </div>
      </div>
    );
  } else if (screen === "home") {
    content = <HomeScreen openBook={openBook} onOpenAddFlow={() => setAddFlowOpen(true)} />;
  } else if (screen === "shelf") {
    content = <ShelfScreen openBook={openBook} onAddBook={() => setAddFlowOpen(true)} />;
  } else if (screen === "timeline") {
    content = <RecordTimeline openBook={openBook} />;
  } else if (screen === "archive") {
    content = <Archive />;
  } else if (screen === "settings") {
    content = <SettingsScreen />;
  } else if (screen === "detail") {
    content = <DetailScreen bookId={selectedBookId} onBack={() => setScreen("shelf")} goRecordCreate={goRecordCreate} goShare={goShare} />;
  } else if (screen === "recordCreate") {
    content = <RecordComposer bookId={selectedBookId} onBack={() => setScreen("detail")} />;
  } else if (screen === "share") {
    content = <ShareCard bookId={selectedBookId} onBack={() => setScreen("detail")} />;
  }

  return (
    <div
      className="uaje-shell"
      style={{ fontFamily: "var(--sans)", margin: "0 auto", height: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,0.05)", position: "relative" }}
    >
      <div className="uaje-scroll" style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {content}
      </div>
      {showNav && <BottomNav screen={screen} setScreen={setScreen} />}
      {addFlowOpen && (
        <AddBookFlow
          onClose={() => {
            setAddFlowOpen(false);
            setScreen("home");
          }}
        />
      )}
      {splashVisible && <SplashScreen exiting={splashExiting} />}
    </div>
  );
}
