import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tổ Chuyên Môn 360",
  description: "Quản lý hồ sơ, kế hoạch và hoạt động tổ chuyên môn trên một không gian thống nhất.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
