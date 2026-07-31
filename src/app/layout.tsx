import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "英文單字卡",
  description: "IELTS 英文單字學習工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
