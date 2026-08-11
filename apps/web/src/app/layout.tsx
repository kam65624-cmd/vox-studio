import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VOX Studio — AI Editorial Video Production",
    template: "%s | VOX Studio",
  },
  description:
    "VOX Studio is an AI-native editorial video production OS. Turn scripts into coherent, branded, narrated, and edited videos.",
  keywords: ["AI video", "editorial production", "video studio", "Prof. Tradeo", "VOX"],
  openGraph: {
    title: "VOX Studio",
    description: "AI-native editorial video production OS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${ibmPlexArabic.variable} ${bebasNeue.variable}`}
    >
      <body className="bg-ink-navy text-paper antialiased min-h-screen font-ui">
        {children}
      </body>
    </html>
  );
}
