import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Sprite } from "@/components/Sprite";
import "@/styles/globals.css";

/* Mono is evidence, sans is argument — see docs/website-spec.md.

   Self-hosted through next/font rather than a Google Fonts <link>: no
   render-blocking request to a third party, and the fallback is metric-
   matched so nothing shifts when the real face arrives. The families are
   exposed as --font-sans / --font-mono, which tokens.css folds into the
   --sans and --mono stacks the rest of the site uses. */

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://exira.ai"),
  title: {
    default: "Exira · Automated technical due diligence",
    template: "%s · Exira",
  },
  description:
    "Exira assesses a target's entire codebase across eleven modules and returns an investor-grade assessment in hours, without ever receiving the code.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Sprite />
        <Nav />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
