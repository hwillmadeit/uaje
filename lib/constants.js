import { Palette, MessageCircle, NotebookPen, BookOpen, Sparkles, Lightbulb, Sprout, Camera, Star } from "lucide-react";

export const COVER_PALETTE = ["#C9845D", "#89977A", "#8196A8", "#B9A184", "#A9825F", "#9A8A6F"];

export function seededVisual(id) {
  const rotations = [0, 0, 0.3, 0, -0.3, 0, 0, 0.3, 0, 0];
  return {
    rotation: rotations[id % rotations.length],
    color: COVER_PALETTE[id % COVER_PALETTE.length],
  };
}

export const SHELF_PER_ROW = 5;
export const BOOK_ASPECT = 68 / 150;

export const RECORD_TYPES = [
  { key: "drawing", label: "그림", desc: "아이의 그림을 사진으로 찍어서 업로드", Icon: Palette },
  { key: "quote", label: "한마디", desc: "아이가 책을 읽고 한 말을 기록", Icon: MessageCircle },
  { key: "diary", label: "일기", desc: "짧은 일기 작성", Icon: NotebookPen },
  { key: "summary", label: "줄거리", desc: "아이의 말이나 부모가 정리한 줄거리", Icon: BookOpen },
  { key: "thought", label: "느낀 점", desc: "아이의 생각", Icon: Sparkles },
  { key: "learned", label: "새롭게 알게 된 것", desc: "책에서 배운 것", Icon: Lightbulb },
  { key: "action", label: "해본 것", desc: "책을 읽고 실제로 해본 활동", Icon: Sprout },
  { key: "photo", label: "사진", desc: "책과 관련된 활동 사진", Icon: Camera },
  { key: "scene", label: "기억에 남는 장면", desc: "가장 기억에 남는 장면", Icon: Star },
];
export const RT = Object.fromEntries(RECORD_TYPES.map((t) => [t.key, t]));

export const STATUS_META = {
  found: { label: "새로 추가돼요", color: "var(--sage)" },
  duplicate: { label: "이미 서재에 있어요 · 다시 읽기로 기록돼요", color: "var(--dusty-blue)" },
  not_found: { label: "책을 찾지 못했어요", color: "var(--text-muted)" },
};

// Pure — takes this book's own sessions/records (not a global lookup), so
// it works the same whether the data came from Supabase or local state.
export function statusLabel(sessions, records) {
  if (sessions.length === 0) return { text: "읽기 전", tone: "muted" };
  if (records.length === 0) return { text: "아직 기록 없음", tone: "muted" };
  if (records.length >= 2) return { text: `기록 ${records.length}개`, tone: "accent" };
  return { text: "읽음", tone: "sage" };
}
