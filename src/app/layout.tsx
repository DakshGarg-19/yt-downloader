import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "KODEX — YT Downloader | Unleash The Media",
  description:
    "Premium YouTube video and audio downloader. Download in 4K MP4, 1080p, Lossless WAV, and 320kbps MP3. Fast, free, and beautiful.",
  keywords: ["youtube downloader", "video downloader", "mp3 downloader", "4k download"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
