import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "英语学习平台 - 四六级 & 考研",
  description: "四六级、考研英语刷题、单词、作文一站式学习平台",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0b0f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full" data-scroll-behavior="smooth">
      <head>
        <meta httpEquiv="Permissions-Policy" content="microphone=(self)" />
      </head>
      <body className="min-h-full" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif', background: '#0a0b0f' }}>
        {children}
      </body>
    </html>
  );
}
