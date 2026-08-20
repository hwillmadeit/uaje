// Lightweight nudge toward dialogic reading (PEER-style prompting) — a
// quiet suggestion of what to ask, not a requirement. Picked once per
// composer visit, not re-rolled on every keystroke.

export const HINTS_BY_TYPE = {
  drawing: ["그림에서 제일 마음에 드는 부분이 어디야?", "이 장면을 왜 그리고 싶었어?"],
  quote: ["책 읽으면서 뭐라고 했어?", "제일 웃겼던 말이 있었어?"],
  diary: ["오늘 이 책에서 어떤 게 남았어?", "짧게 한 줄이라도 괜찮아요."],
  summary: ["무슨 이야기였는지 설명해줄 수 있어?", "누가 나왔는지 말해볼까?"],
  thought: ["주인공이 그렇게 한 게 어떻게 느껴졌어?", "너라면 어떻게 했을 것 같아?"],
  learned: ["처음 알게 된 게 있었어?", "신기했던 부분이 있었어?"],
  action: ["책에서 본 거랑 실제로 해보니까 어땠어?", "다음엔 또 뭘 해보고 싶어?"],
  photo: ["이 활동에서 제일 재밌었던 순간은 언제였어?"],
  scene: ["왜 그 장면이 제일 기억에 남았어?", "그 장면에서 무슨 일이 있었어?"],
};

export const REREAD_HINTS = ["지난번이랑 뭐가 다르게 느껴져?", "이번엔 뭐가 새롭게 보였어?", "지난번엔 몰랐는데 이번엔 알게 된 게 있어?"];

export function pickHint(type, isReread) {
  const pool = isReread ? [...(HINTS_BY_TYPE[type] || []), ...REREAD_HINTS] : HINTS_BY_TYPE[type] || [];
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
