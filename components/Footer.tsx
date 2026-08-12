"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookDemo } from "./BookDemo";

/* Same link-resolution rule as the header — see Nav.tsx. */

const SECTIONS = [
  { hash: "#security", label: "Isolation" },
  { hash: "#coverage", label: "Modules" },
  { hash: "#report", label: "Report" },
];

export function Footer() {
  const pathname = usePathname();
  const home = pathname === "/";
  const to = (hash: string) => (home ? hash : `/${hash}`);

  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div>
          <Link href={home ? "#top" : "/"} aria-label="Exira home">
            <svg className="logo" role="img" aria-label="Exira">
              <use href="#sym-lockup" />
            </svg>
          </Link>
          <p className="foot-c">
            © 2026 Exira · <Link href="/privacy">Privacy</Link>
          </p>
        </div>
        <nav className="foot-l">
          {SECTIONS.map((s) => (
            <a key={s.hash} href={to(s.hash)}>
              {s.label}
            </a>
          ))}
          {home && <Link href="/thesis">Thesis</Link>}
          <BookDemo source="footer">Book demo</BookDemo>
        </nav>
      </div>
    </footer>
  );
}
