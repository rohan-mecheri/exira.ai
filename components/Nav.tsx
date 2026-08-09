"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "./Arrow";

/* Static header: no sticky behaviour, by design.

   One copy, shared by every route. Section links resolve against the home
   page, so from /thesis they carry the leading slash and from / they stay
   as bare fragments — otherwise the browser would treat them as a
   navigation and lose the smooth in-page scroll. */

const SECTIONS = [
  { hash: "#security", label: "Security" },
  { hash: "#coverage", label: "Coverage" },
  { hash: "#report", label: "The report" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const home = pathname === "/";

  // On the home page these are in-document jumps; anywhere else they are
  // links back to it.
  const to = (hash: string) => (home ? hash : `/${hash}`);

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link href={home ? "#top" : "/"} aria-label="Exira — home">
          <svg className="logo" role="img" aria-label="Exira">
            <use href="#sym-lockup" />
          </svg>
        </Link>

        <button
          className="burger"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="21" height="13" viewBox="0 0 21 13" fill="currentColor" aria-hidden="true">
            <rect width="21" height="1.5" />
            <rect y="5.7" width="21" height="1.5" />
            <rect y="11.4" width="21" height="1.5" />
          </svg>
        </button>

        <nav
          className={open ? "nav-links open" : "nav-links"}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {SECTIONS.map((s) => (
            <a key={s.hash} href={to(s.hash)}>
              {s.label}
            </a>
          ))}
          <Link href="/thesis" aria-current={pathname === "/thesis" ? "page" : undefined}>
            Thesis
          </Link>
          <a className="btn" href={to("#demo")}>
            Book demo
            <ArrowRight />
          </a>
        </nav>
      </div>
    </header>
  );
}
