import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "A.K.A.S.H.I.C. | Cyber Intelligence & Forensic Platform",
  description: "Autonomous Knowledge-base for Anti-narcotics, Syndicate Hotspots & Inter-agency Cyber-forensics (Project A.K.A.S.H.I.C.).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} ${jetbrains.variable} font-sans antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
