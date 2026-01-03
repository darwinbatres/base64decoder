import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "Base64 Viewer",
  description:
    "Decode, preview, and download base64 encoded documents. Supports PDF, images, video, audio, JSON, XML, HTML, and text.",
  keywords: [
    "base64",
    "decoder",
    "viewer",
    "pdf",
    "image",
    "video",
    "audio",
    "json",
    "document",
    "preview",
  ],
  authors: [{ name: "Base64 Viewer" }],
  creator: "Base64 Viewer",
  metadataBase: new URL("https://base64viewer.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Base64 Viewer",
    description: "Decode, preview, and download base64 encoded documents",
    siteName: "Base64 Viewer",
  },
  twitter: {
    card: "summary",
    title: "Base64 Viewer",
    description: "Decode, preview, and download base64 encoded documents",
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
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
