import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { WEBMCP_ORIGIN_TRIAL_TOKEN } from "@/lib/origin-trial";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://protocol-mirror.vercel.app"),
  applicationName: "Protocol Mirror",
  title: "Protocol Mirror · Did the trial publish what it registered?",
  description:
    "Load a real ClinicalTrials.gov record and its PubMed report. Your agent quotes exact outcome text and stages discrepancies through WebMCP; you decide.",
  category: "research transparency",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Protocol Mirror",
    title: "Protocol Mirror · Did the trial publish what it registered?",
    description: "Registry vs publication review with WebMCP: the agent cites exact spans and proposes, a human decides.",
  },
  twitter: {
    card: "summary",
    title: "Protocol Mirror · Did the trial publish what it registered?",
    description: "Registry vs publication review with WebMCP: the agent cites exact spans and proposes, a human decides.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${newsreader.variable}`}>
      <head>
        {/* Origin-trial tokens are origin-bound and meant to be public; see src/lib/origin-trial.ts. */}
        {WEBMCP_ORIGIN_TRIAL_TOKEN && <meta httpEquiv="origin-trial" content={WEBMCP_ORIGIN_TRIAL_TOKEN} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
