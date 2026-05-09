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
  icons: { icon: "/favicon.ico" },
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
