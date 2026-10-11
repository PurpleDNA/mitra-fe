import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  // Resolves the social preview image (app/opengraph-image.png) to the live site.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mitra-fe-zeta.vercel.app"),
  title: "Mitra — the clearinghouse for agentic commerce",
  description:
    "Mitra is the financial coordination layer between AI agents and money. It holds each budget, checks every payment, carries every deal through failure, and cancels out what agents owe each other, so only what remains ever moves.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
