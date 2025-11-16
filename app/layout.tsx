import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rihlah DOS Library",
  description:
    "A Next.js + js-dos playground for loading curated shareware gems directly in the browser.",
  metadataBase: new URL("https://github.com/ragaeeb/rihlah"),
  openGraph: {
    title: "Rihlah DOS Library",
    description: "Load Jetpack, Keen, Wolf3D, and more via js-dos.",
    url: "https://github.com/ragaeeb/rihlah",
    siteName: "Rihlah",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rihlah DOS Library",
    description: "Boot classic DOS shareware games instantly with js-dos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <head>
        <link rel="stylesheet" href="https://v8.js-dos.com/latest/js-dos.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        <Script
          src="https://v8.js-dos.com/latest/js-dos.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
