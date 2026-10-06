import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import "@/styles/globals.css";

/* One face, set throughout. Figures that need to line up use tabular
   numerals rather than a monospace.

   Self-hosted through next/font rather than a Google Fonts <link>: no
   render-blocking request to a third party, and the fallback is metric-
   matched so nothing shifts when the real face arrives. The family is
   exposed as --font-sans, which tokens.css folds into the --sans stack the
   rest of the site uses. */

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  /* The www host, because that is the one that serves: the apex 308s to
     it. metadataBase is what Next resolves canonical, OG and Twitter URLs
     against, so pointing it at the redirecting host publishes addresses
     that bounce — in link previews and to crawlers, both of which treat a
     redirect as a weaker signal than the real thing. Change this if the
     canonical host ever changes; it is the one origin the app hardcodes. */
  metadataBase: new URL("https://www.exira.ai"),
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
    <html lang="en" className={sans.variable}>
      <body>
        <Sprite />
        <Nav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
