import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LirycVid+ — AI Music Video Studio",
  description: "Turn your song into a visual story. Generate lyric videos and scene-based music videos with AI.",
  manifest: "/LyricVid_plus/manifest.json",
  themeColor: "#7c3aed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LirycVid+",
  },
  icons: {
    icon: [
      { url: "/LyricVid_plus/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/LyricVid_plus/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/LyricVid_plus/icons/icon-152.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-studio-bg text-ink-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
