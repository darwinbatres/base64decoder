import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Github } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Base64 Utils",
  description:
    "Encode, decode, and preview base64 files. Supports PDF, images, video, audio, JSON, XML, HTML, and text.",
  keywords: [
    "base64",
    "encoder",
    "decoder",
    "viewer",
    "pdf",
    "image",
    "video",
    "audio",
    "json",
    "document",
    "preview",
    "convert",
  ],
  authors: [{ name: "Base64 Utils" }],
  creator: "Base64 Utils",
  metadataBase: new URL("https://base64viewer.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Base64 Utils",
    description: "Encode, decode, and preview base64 files",
    siteName: "Base64 Utils",
  },
  twitter: {
    card: "summary",
    title: "Base64 Utils",
    description: "Encode, decode, and preview base64 files",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          {/* GitHub Ribbon - Vertical Left Side */}
          <a
            href="https://github.com/darwinbatres/base64decoder"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed left-0 bottom-8 z-50 flex items-center gap-2 px-2.5 py-3 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-r-lg shadow-lg hover:translate-x-0.5 hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 writing-mode-vertical"
            style={{ writingMode: "vertical-rl" }}
            aria-label="View source on GitHub"
          >
            <Github className="h-4 w-4 rotate-90" aria-hidden="true" />
            <span>Open Source</span>
          </a>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
