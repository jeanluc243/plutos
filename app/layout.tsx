import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const uberMoveText = localFont({
  src: [
    { path: "./fonts/UberMoveText-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/UberMoveText-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/UberMoveText-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-uber-move-text",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: "Arial",
});
const uberMoveDisplay = localFont({
  src: [
    { path: "./fonts/UberMove-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/UberMove-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-uber-move-display",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: { default: "Plutos", template: "%s · Plutos" },
  applicationName: "Plutos",
  description: "Votre espace Plutos, clair et sécurisé.",
  icons: {
    icon: [
      { url: "/brand/icons/plutos-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/icons/plutos-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icons/plutos-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/plutos-mark.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [{ url: "/brand/icons/plutos-apple-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { title: "Plutos" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${uberMoveText.variable} ${uberMoveDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
