import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Protocol Mirror · Outcome integrity review",
  description:
    "An accountable human-agent workspace for comparing registered clinical-trial outcomes with published reports.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
