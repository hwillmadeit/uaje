import "./globals.css";

export const metadata = {
  title: "우아재 — 우리 아이 서재",
  description: "우리 아이의 책과 생각이 자라는 곳",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
