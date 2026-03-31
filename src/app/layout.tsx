import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free Image Background Remover Online — Remove BG in Seconds",
  description:
    "Remove image backgrounds instantly with AI. Free, no signup required. Upload your photo and download the transparent PNG result in seconds.",
  keywords: "image background remover, remove background, remove bg, transparent background, free background remover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
