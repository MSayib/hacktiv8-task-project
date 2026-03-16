import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#4285F4",
};

export const metadata: Metadata = {
  title: "KodingBuddy — Belajar Coding Jadi Seru!",
  description:
    "AI Chatbot untuk belajar pemrograman dan teknologi. Dibuat oleh Sayib.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KodingBuddy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
