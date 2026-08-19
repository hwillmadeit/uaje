"use client";

import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Eraser, RotateCcw, Undo2 } from "lucide-react";

const COLORS = ["#332B24", "#C9845D", "#D9534F", "#E8A33D", "#7CB342", "#3D8BCC", "#8E6BC2", "#B9A184"];
const BRUSH_SIZES = [
  { label: "가는 선", value: 3 },
  { label: "중간", value: 7 },
  { label: "굵게", value: 14 },
];
const MAX_HISTORY = 20;

// Exposes toBlob() via ref so the parent (RecordComposer) can grab the
// drawing when the person hits "기록 저장하기" — the canvas itself doesn't
// know anything about records/uploads, it just draws.
const DrawingPad = forwardRef(function DrawingPad(_props, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const history = useRef([]); // snapshots taken right before each stroke
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(BRUSH_SIZES[1].value);
  const [erasing, setErasing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#FEFCF6";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // getImageData/putImageData operate on the canvas's raw pixel buffer and
  // ignore the ctx.scale() transform, so capturing the full canvas.width /
  // canvas.height here is correct regardless of device pixel ratio.
  function pushHistory() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > MAX_HISTORY) history.current.shift();
    setCanUndo(true);
  }

  function handlePointerDown(e) {
    canvasRef.current.setPointerCapture(e.pointerId);
    pushHistory();
    drawing.current = true;
    last.current = getPos(e);
    setHasDrawn(true);
  }

  function handlePointerMove(e) {
    if (!drawing.current) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = erasing ? "#FEFCF6" : color;
    ctx.lineWidth = erasing ? size * 2.2 : size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function undo() {
    if (history.current.length === 0) return;
    const prev = history.current.pop();
    canvasRef.current.getContext("2d").putImageData(prev, 0, 0);
    setCanUndo(history.current.length > 0);
    if (history.current.length === 0) setHasDrawn(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FEFCF6";
    ctx.fillRect(0, 0, rect.width, rect.height);
    history.current = [];
    setCanUndo(false);
    setHasDrawn(false);
  }

  useImperativeHandle(ref, () => ({
    hasDrawn: () => hasDrawn,
    toBlob: () =>
      new Promise((resolve) => {
        canvasRef.current.toBlob(resolve, "image/png");
      }),
  }));

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: "100%",
          height: 220,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          touchAction: "none",
          cursor: "crosshair",
          display: "block",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setErasing(false);
              }}
              className="uaje-tap"
              aria-label={`색상 ${c}`}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border: !erasing && color === c ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="uaje-tap"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: canUndo ? "var(--text-secondary)" : "var(--border-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: canUndo ? "pointer" : "default",
            }}
            aria-label="되돌리기"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={() => setErasing((v) => !v)}
            className="uaje-tap"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: `1px solid ${erasing ? "var(--terracotta)" : "var(--border)"}`,
              background: erasing ? "var(--terracotta)" : "var(--surface)",
              color: erasing ? "#FBF8F0" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="지우개"
          >
            <Eraser size={13} />
          </button>
          <button
            onClick={clearCanvas}
            className="uaje-tap"
            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            aria-label="전체 지우기"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.value}
            onClick={() => setSize(b.value)}
            className="uaje-tap"
            style={{
              flex: 1,
              padding: "6px 0",
              fontSize: 11,
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${size === b.value ? "var(--terracotta)" : "var(--border)"}`,
              background: size === b.value ? "var(--surface-soft)" : "none",
              color: size === b.value ? "var(--terracotta)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default DrawingPad;

